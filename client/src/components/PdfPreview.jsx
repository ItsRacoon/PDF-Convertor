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
    <div className="pdf-preview-section">
      <div className="pdf-preview-header">
        <h3 className="pdf-preview-title">PDF Preview</h3>
        <div className="pdf-preview-filename">{fileName}</div>
      </div>
      
      <div 
        ref={containerRef}
        className="pdf-viewer-container"
      >
        {isLoading && (
          <div className="pdf-loading-overlay">
            <div className="pdf-loading-spinner">
              <div className="pdf-spinner"></div>
              <span>Loading...</span>
            </div>
          </div>
        )}
        
        <div className="pdf-document-container">
          {/* Canvas rendering mode */}
          <canvas 
            ref={canvasRef} 
            className={`pdf-canvas ${renderMode === 'canvas' ? 'active' : ''}`}
          />
          
          {/* Text rendering mode */}
          {renderMode === 'text' && (
            <div 
              ref={textLayerRef}
              className="pdf-text-layer"
            >
              {textItems.map((item, index) => (
                <div 
                  key={index}
                  className="pdf-text-item"
                  style={{
                    left: `${item.x}px`,
                    top: `${item.y}px`,
                    fontSize: `${item.height}px`,
                  }}
                >
                  {item.text}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="pdf-controls-bar">
        <div className="pdf-page-controls">
          <button 
            className="pdf-control-button" 
            onClick={prevPage} 
            disabled={currentPage <= 1 || isLoading}
            title="Previous Page"
          >
            <i className="bi bi-chevron-left"></i>
          </button>
          
          <div className="pdf-page-indicator">
            <input 
              type="text" 
              className="pdf-page-input"
              value={currentPage}
              onChange={(e) => setCurrentPage(parseInt(e.target.value) || currentPage)}
              onKeyDown={jumpToPage}
              aria-label="Page number"
            />
            <span className="pdf-page-count">of {numPages}</span>
          </div>
          
          <button 
            className="pdf-control-button" 
            onClick={nextPage} 
            disabled={currentPage >= numPages || isLoading}
            title="Next Page"
          >
            <i className="bi bi-chevron-right"></i>
          </button>
        </div>
        
        <div className="pdf-zoom-controls">
          <button 
            className="pdf-control-button" 
            onClick={zoomOut} 
            disabled={isLoading}
            title="Zoom Out"
          >
            <i className="bi bi-zoom-out"></i>
          </button>
          
          <button 
            className="pdf-control-button pdf-zoom-indicator" 
            onClick={fitWidth} 
            disabled={isLoading}
            title="Fit to Width"
          >
            {Math.round(scale * 100)}%
          </button>
          
          <button 
            className="pdf-control-button" 
            onClick={zoomIn} 
            disabled={isLoading}
            title="Zoom In"
          >
            <i className="bi bi-zoom-in"></i>
          </button>
          
          <button 
            className={`pdf-control-button pdf-mode-toggle ${renderMode === 'text' ? 'active' : ''}`}
            onClick={() => setRenderMode(mode => mode === 'canvas' ? 'text' : 'canvas')}
            title={renderMode === 'canvas' ? 'Switch to Text Mode' : 'Switch to Image Mode'}
          >
            <i className={`bi bi-${renderMode === 'canvas' ? 'text-paragraph' : 'image'}`}></i>
          </button>
        </div>
      </div>

      <style jsx>{`
        /* Main container styles */
        .pdf-preview-section {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          min-height: 500px;
          background-color: #f5f7fa;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          overflow: hidden;
        }

        /* Header styles */
        .pdf-preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background-image: linear-gradient(to right, #4776e6, #8e54e9);
          color: white;
          border-radius: 8px 8px 0 0;
        }

        .pdf-preview-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .pdf-preview-filename {
          font-size: 14px;
          max-width: 50%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          opacity: 0.9;
        }

        /* Viewer container */
        .pdf-viewer-container {
          flex: 1;
          position: relative;
          overflow: auto;
          background-color: #e9ecef;
          padding: 20px;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        /* Document container */
        .pdf-document-container {
          position: relative;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          transition: transform 0.2s ease;
        }

        .pdf-document-container:hover {
          transform: translateY(-2px);
        }

        /* Canvas styles */
        .pdf-canvas {
          display: block;
          background-color: white;
          border-radius: 2px;
        }

        .pdf-canvas.active {
          display: block;
        }

        .pdf-canvas:not(.active) {
          display: none;
        }

        /* Text layer styles */
        .pdf-text-layer {
          position: relative;
          background-color: white;
          overflow: hidden;
          border-radius: 2px;
        }

        .pdf-text-item {
          position: absolute;
          white-space: pre;
          color: #333;
          transform-origin: 0% 0%;
        }

        /* Loading overlay */
        .pdf-loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10;
        }

        .pdf-loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .pdf-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top-color: #4776e6;
          animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Controls bar */
        .pdf-controls-bar {
          display: flex;
          justify-content: space-between;
          padding: 12px 16px;
          background-color: white;
          border-top: 1px solid #e0e0e0;
          border-radius: 0 0 8px 8px;
          box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.03);
        }

        /* Page controls */
        .pdf-page-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pdf-page-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: #555;
        }

        .pdf-page-input {
          width: 40px;
          padding: 5px;
          text-align: center;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .pdf-page-count {
          white-space: nowrap;
        }

        /* Zoom controls */
        .pdf-zoom-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* Control buttons */
        .pdf-control-button {
          display: flex;
          justify-content: center;
          align-items: center;
          min-width: 34px;
          height: 34px;
          padding: 0 8px;
          border: none;
          background-color: #f5f7fa;
          color: #555;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pdf-control-button:hover:not(:disabled) {
          background-color: #e9ecef;
          color: #333;
        }

        .pdf-control-button:active:not(:disabled) {
          transform: translateY(1px);
        }

        .pdf-control-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pdf-control-button.active {
          background-color: #4776e6;
          color: white;
        }

        .pdf-zoom-indicator {
          min-width: 60px;
          font-size: 14px;
          font-weight: 500;
        }

        .pdf-mode-toggle {
          margin-left: 8px;
          border-left: 1px solid #e0e0e0;
          padding-left: 16px;
        }

        /* Responsive styles */
        @media (max-width: 640px) {
          .pdf-preview-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
            padding: 10px 12px;
          }

          .pdf-preview-filename {
            max-width: 100%;
          }

          .pdf-controls-bar {
            flex-direction: column;
            gap: 10px;
          }

          .pdf-page-controls, .pdf-zoom-controls {
            justify-content: center;
            width: 100%;
          }
          
          .pdf-zoom-controls {
            padding-top: 8px;
            border-top: 1px solid #eee;
          }
          
          .pdf-mode-toggle {
            margin-left: 0;
            border-left: none;
            padding-left: 8px;
          }
        }
      `}</style>
    </div>
  );
}

export default PdfPreview;