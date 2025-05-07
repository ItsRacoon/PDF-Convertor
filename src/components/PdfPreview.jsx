import { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source from CDN for PDF.js v5+
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.2.133/build/pdf.worker.min.mjs';

function PdfPreview({ file }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const textLayerRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [renderMode, setRenderMode] = useState('canvas'); // 'canvas' or 'text'
  const [textItems, setTextItems] = useState([]);
  
  // Load PDF when file changes
  useEffect(() => {
    if (!file) return;
    
    setFileName(file.name);
    setIsLoading(true);
    
    const fileReader = new FileReader();
    fileReader.onload = async function() {
      try {
        const typedArray = new Uint8Array(this.result);
        const loadedPdf = await pdfjsLib.getDocument(typedArray).promise;
        setPdfDoc(loadedPdf);
        setNumPages(loadedPdf.numPages);
        setCurrentPage(1);
        
        // Auto fit to width on initial load
        setTimeout(fitWidth, 100);
      } catch (error) {
        console.error('Error loading PDF:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fileReader.readAsArrayBuffer(file);
  }, [file]);
  
  // Memoized render function to optimize performance
  const renderPage = useCallback(async () => {
    if (!pdfDoc) return;
    
    setIsLoading(true);
    try {
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale });
      
      // Set dimensions for both canvas and text layer
      const width = viewport.width;
      const height = viewport.height;
      
      if (renderMode === 'canvas') {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        canvas.height = height;
        canvas.width = width;
        
        // Add subtle shadow for better appearance
        context.shadowColor = 'rgba(0, 0, 0, 0.1)';
        context.shadowBlur = 5;
        context.shadowOffsetX = 2;
        context.shadowOffsetY = 2;
        
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
      }
      
      // Always extract text content for text mode
      if (renderMode === 'text') {
        const textContent = await page.getTextContent();
        const items = textContent.items.map(item => {
          const transform = pdfjsLib.Util.transform(
            viewport.transform,
            item.transform
          );
          return {
            text: item.str,
            x: transform[4],
            y: transform[5],
            width: item.width * viewport.scale,
            height: item.height * viewport.scale
          };
        });
        setTextItems(items);
        
        // Ensure text layer has correct dimensions
        if (textLayerRef.current) {
          textLayerRef.current.style.width = `${width}px`;
          textLayerRef.current.style.height = `${height}px`;
        }
      }
    } catch (error) {
      console.error('Error rendering page:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pdfDoc, currentPage, scale, renderMode]);
  
  // Render page when page number, scale, or mode changes
  useEffect(() => {
    renderPage();
  }, [renderPage]);
  
  // Navigation functions
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const nextPage = () => currentPage < numPages && setCurrentPage(currentPage + 1);
  
  // Zoom functions
  const zoomIn = () => setScale(prevScale => Math.min(prevScale + 0.25, 3.0));
  const zoomOut = () => setScale(prevScale => Math.max(prevScale - 0.25, 0.5));
  
  const fitWidth = () => {
    if (!containerRef.current || !pdfDoc) return;
    
    pdfDoc.getPage(currentPage).then(page => {
      const viewport = page.getViewport({ scale: 1.0 });
      const newScale = (containerRef.current.clientWidth - 40) / viewport.width;
      setScale(newScale);
    });
  };
  
  // Handle page input
  const jumpToPage = (e) => {
    if (e.key === 'Enter') {
      const pageNum = parseInt(e.target.value);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= numPages) {
        setCurrentPage(pageNum);
      }
    }
  };
  
  return (
    <div className="preview-section">
      <div className="preview-header">
        <h3>PDF Preview</h3>
        <div className="preview-filename">{fileName}</div>
      </div>
      
      <div 
        ref={containerRef}
        className="pdf-viewer"
      >
        {isLoading && (
          <div className="loading-spinner">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
        
        <div className="pdf-document">
          {/* Canvas rendering mode */}
          <canvas 
            ref={canvasRef} 
            style={{ 
              display: renderMode === 'canvas' ? 'block' : 'none',
              backgroundColor: 'white'
            }} 
          />
          
          {/* Text rendering mode */}
          {renderMode === 'text' && (
            <div 
              ref={textLayerRef}
              style={{ 
                position: 'relative',
                backgroundColor: 'white',
                overflow: 'hidden'
              }}
            >
              {textItems.map((item, index) => (
                <div 
                  key={index}
                  style={{
                    position: 'absolute',
                    left: `${item.x}px`,
                    top: `${item.y}px`,
                    fontSize: `${item.height}px`,
                    whiteSpace: 'pre'
                  }}
                >
                  {item.text}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="pdf-controls">
        <div className="page-controls">
          <button 
            className="control-button" 
            onClick={prevPage} 
            disabled={currentPage <= 1 || isLoading}
          >
            <i className="bi bi-chevron-left"></i>
          </button>
          
          <div className="page-input">
            <input 
              type="text" 
              value={currentPage}
              onChange={(e) => setCurrentPage(parseInt(e.target.value) || currentPage)}
              onKeyDown={jumpToPage}
            />
            <span>of {numPages}</span>
          </div>
          
          <button 
            className="control-button" 
            onClick={nextPage} 
            disabled={currentPage >= numPages || isLoading}
          >
            <i className="bi bi-chevron-right"></i>
          </button>
        </div>
        
        <div className="zoom-controls">
          <button 
            className="control-button" 
            onClick={zoomOut} 
            disabled={isLoading}
          >
            <i className="bi bi-zoom-out"></i>
          </button>
          
          <button 
            className="control-button" 
            onClick={fitWidth} 
            disabled={isLoading}
          >
            {Math.round(scale * 100)}%
          </button>
          
          <button 
            className="control-button" 
            onClick={zoomIn} 
            disabled={isLoading}
          >
            <i className="bi bi-zoom-in"></i>
          </button>
          
          <button 
            className={`control-button ${renderMode === 'text' ? 'active' : ''}`}
            onClick={() => setRenderMode(mode => mode === 'canvas' ? 'text' : 'canvas')}
          >
            <i className={`bi bi-${renderMode === 'canvas' ? 'text-paragraph' : 'image'}`}></i>
          </button>
        </div>
      </div>
    </div>
  );
}

export default PdfPreview;