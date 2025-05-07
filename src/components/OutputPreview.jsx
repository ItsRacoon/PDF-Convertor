import { useState, useEffect, useRef } from 'react';

function OutputPreview({ previewUrl, format }) {
  const [content, setContent] = useState('');
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const contentRef = useRef(null);
  const containerRef = useRef(null);
  
  // Format-specific styling
  const getFormatInfo = () => {
    switch(format?.toLowerCase()) {
      case 'docx': 
        return { 
          icon: 'bi-file-earmark-word-fill',
          color: 'primary',
          name: 'Word Document'
        };
      case 'csv': 
        return { 
          icon: 'bi-file-earmark-spreadsheet-fill',
          color: 'success',
          name: 'CSV Spreadsheet'
        };
      case 'xlsx': 
        return { 
          icon: 'bi-file-earmark-excel-fill',
          color: 'success',
          name: 'Excel Spreadsheet'
        };
      default: 
        return { 
          icon: 'bi-file-earmark-fill',
          color: 'secondary',
          name: 'Document'
        };
    }
  };
  
  const formatInfo = getFormatInfo();
  
  useEffect(() => {
    if (!previewUrl) return;
    
    setIsLoading(true);
    setError(null);
    
    const fetchPreview = async () => {
      try {
        const response = await fetch(previewUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch preview`);
        }
        const html = await response.text();
        setContent(html);
        setTimeout(() => {
          fitWidth();
          setIsLoading(false);
        }, 100);
      } catch (error) {
        console.error('Error fetching preview:', error);
        setError(error.message);
        setIsLoading(false);
      }
    };
    
    fetchPreview();
  }, [previewUrl]);
  
  const zoomIn = () => setScale(prev => Math.min(prev + 0.1, 2.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
  const resetZoom = () => setScale(1.0);
  
  const fitWidth = () => {
    if (!contentRef.current || !containerRef.current) return;
    
    const container = containerRef.current;
    const content = contentRef.current;
    
    if (content) {
      const contentWidth = content.scrollWidth - 40;
      const containerWidth = container.clientWidth;
      const newScale = containerWidth / contentWidth;
      setScale(Math.min(Math.max(newScale, 0.5), 1.5));
    }
  };
  
  // Add print functionality
  const printPreview = () => {
    if (!content) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print ${format.toUpperCase()} Preview</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            table { border-collapse: collapse; width: 100%; }
            table, th, td { border: 1px solid #ddd; }
            th, td { padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            @media print {
              body { margin: 0; padding: 15px; }
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };
  
  return (
    <div className="output-section">
      <div className="output-header">
        <div className="output-title">
          <i className={`bi ${formatInfo.icon} output-icon`}></i>
          <h3>{formatInfo.name} Preview</h3>
        </div>
        <div className="output-actions">
          <button 
            className="action-button print-button"
            onClick={printPreview}
            disabled={isLoading || !content}
            title="Print Preview"
          >
            <i className="bi bi-printer-fill"></i>
          </button>
        </div>
      </div>
      
      <div ref={containerRef} className="output-viewer">
        {isLoading && (
          <div className="loading-indicator">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <h5>Error Loading Preview</h5>
            <p>{error}</p>
          </div>
        )}
        
        {!isLoading && !error && content && (
          <div 
            ref={contentRef}
            className="preview-content"
            style={{ transform: `scale(${scale})` }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}
        
        {!isLoading && !error && !content && (
          <div className="no-preview">
            <i className="bi bi-file-earmark"></i>
            <h5>No Preview Available</h5>
            <p>The preview could not be generated.</p>
          </div>
        )}
      </div>
      
      <div className="output-controls">
        <div className="zoom-info">
          Scale: {Math.round(scale * 100)}%
        </div>
        <div className="control-buttons">
          <button 
            className="control-button"
            onClick={zoomOut} 
            disabled={scale <= 0.5 || isLoading}
            title="Zoom Out"
          >
            <i className="bi bi-zoom-out"></i>
          </button>
          
          <button 
            className="control-button"
            onClick={resetZoom} 
            disabled={isLoading}
            title="Reset Zoom"
          >
            <i className="bi bi-arrow-counterclockwise"></i>
          </button>
          
          <button 
            className="control-button"
            onClick={zoomIn} 
            disabled={scale >= 2.0 || isLoading}
            title="Zoom In"
          >
            <i className="bi bi-zoom-in"></i>
          </button>
          
          <button 
            className="control-button"
            onClick={fitWidth} 
            disabled={isLoading}
            title="Fit to Width"
          >
            <i className="bi bi-arrows-angle-expand"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

export default OutputPreview;