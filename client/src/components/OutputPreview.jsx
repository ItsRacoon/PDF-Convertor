import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './OutputPreview.css'; // Import the new external CSS file

// Define format configurations in a separate object for better maintainability
const FORMAT_CONFIG = {
  docx: { 
    icon: 'bi-file-earmark-word-fill',
    color: 'primary',
    name: 'Word Document'
  },
  csv: { 
    icon: 'bi-file-earmark-spreadsheet-fill',
    color: 'success',
    name: 'CSV Spreadsheet'
  },
  xlsx: { 
    icon: 'bi-file-earmark-excel-fill',
    color: 'success',
    name: 'Excel Spreadsheet'
  },
  default: { 
    icon: 'bi-file-earmark-fill',
    color: 'secondary',
    name: 'Document'
  }
};

// Scale constants to avoid magic numbers
const SCALE = {
  MIN: 0.5,
  MAX: 2.0,
  DEFAULT: 1.0,
  STEP: 0.1
};

function OutputPreview({ previewUrl, format, customStyles = {} }) {
  const [content, setContent] = useState('');
  const [scale, setScale] = useState(SCALE.DEFAULT);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const contentRef = useRef(null);
  const containerRef = useRef(null);
  
  // Use memoization for format info to avoid recalculation on every render
  const formatInfo = useMemo(() => {
    const formatKey = format?.toLowerCase();
    return FORMAT_CONFIG[formatKey] || FORMAT_CONFIG.default;
  }, [format]);
  
  // Fetch content using a callback to avoid recreating on every render
  const fetchPreview = useCallback(async (url) => {
    if (!url) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch preview (Status: ${response.status})`);
      }
      
      const html = await response.text();
      setContent(html);
      
      // Schedule fit width after render
      setTimeout(() => {
        fitWidth();
        setIsLoading(false);
      }, 100);
    } catch (error) {
      console.error('Error fetching preview:', error);
      setError(error.message || 'Failed to load preview');
      setIsLoading(false);
    }
  }, []);
  
  // Effect hook for fetching content
  useEffect(() => {
    fetchPreview(previewUrl);
  }, [previewUrl, fetchPreview]);
  
  // Zoom controls with guard clauses
  const zoomIn = () => {
    if (scale >= SCALE.MAX) return;
    setScale(prev => Math.min(prev + SCALE.STEP, SCALE.MAX));
  };
  
  const zoomOut = () => {
    if (scale <= SCALE.MIN) return;
    setScale(prev => Math.max(prev - SCALE.STEP, SCALE.MIN));
  };
  
  const resetZoom = () => setScale(SCALE.DEFAULT);
  
  // Improved fitWidth with null checks and better scaling logic
  const fitWidth = useCallback(() => {
    if (!contentRef.current || !containerRef.current) return;
    
    const container = containerRef.current;
    const content = contentRef.current;
    
    // Ensure content has dimensions before calculating
    if (content && content.scrollWidth > 0) {
      const contentWidth = content.scrollWidth;
      const containerWidth = container.clientWidth - 48; // Account for padding
      
      if (containerWidth > 0) {
        const newScale = containerWidth / contentWidth;
        setScale(Math.min(Math.max(newScale, SCALE.MIN), SCALE.MAX));
      }
    }
  }, []);
  
  // Enhanced print function with error handling
  const printPreview = useCallback(() => {
    if (!content) return;
    
    try {
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        alert('Please allow pop-ups for printing functionality');
        return;
      }
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Print ${format?.toUpperCase() || 'Document'}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              table { border-collapse: collapse; width: 100%; max-width: 100%; }
              table, th, td { border: 1px solid #ddd; }
              th, td { padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              img { max-width: 100%; height: auto; }
              @media print {
                body { margin: 0; padding: 15px; }
                a { text-decoration: none; color: #000; }
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
      }, 300);
    } catch (error) {
      console.error('Error printing preview:', error);
      alert('Failed to open print preview. Please check your browser settings.');
    }
  }, [content, format]);
  
  // Add window resize listener for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      fitWidth();
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [fitWidth]);
  
  // Apply custom styles if provided
  const containerStyle = { ...(customStyles.container || {}) };
  
  return (
    <div className="output-section" style={containerStyle}>
      <div className="output-header">
        <div className="output-title">
          <i className={`bi ${formatInfo.icon} output-icon text-${formatInfo.color}`}></i>
          <h3>{formatInfo.name} Preview</h3>
        </div>
        <div className="output-actions">
          <button 
            className="action-button print-button"
            onClick={printPreview}
            disabled={isLoading || !content}
            title="Print Preview"
            aria-label="Print Preview"
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
            <p className="loading-text">Loading preview...</p>
          </div>
        )}
        
        {error && (
          <div className="error-message" role="alert">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <h5>Error Loading Preview</h5>
            <p>{error}</p>
          </div>
        )}
        
        {!isLoading && !error && content && (
          <div 
            ref={contentRef}
            className="preview-content"
            style={{ 
              transform: `scale(${scale})`,
              transformOrigin: 'top left'
            }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}
        
        {!isLoading && !error && !content && (
          <div className="no-preview">
            <i className="bi bi-file-earmark"></i>
            <h5>No Preview Available</h5>
            <p>The preview could not be generated or is empty.</p>
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
            disabled={scale <= SCALE.MIN || isLoading}
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <i className="bi bi-zoom-out"></i>
          </button>
          
          <button 
            className="control-button"
            onClick={resetZoom} 
            disabled={isLoading}
            title="Reset Zoom"
            aria-label="Reset Zoom"
          >
            <i className="bi bi-arrow-counterclockwise"></i>
          </button>
          
          <button 
            className="control-button"
            onClick={zoomIn} 
            disabled={scale >= SCALE.MAX || isLoading}
            title="Zoom In"
            aria-label="Zoom In"
          >
            <i className="bi bi-zoom-in"></i>
          </button>
          
          <button 
            className="control-button"
            onClick={fitWidth} 
            disabled={isLoading}
            title="Fit to Width"
            aria-label="Fit to Width"
          >
            <i className="bi bi-arrows-angle-expand"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

export default OutputPreview;