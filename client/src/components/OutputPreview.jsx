import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './OutputPreview.css'; // Import the CSS file

// Define format configurations
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

// Scale constants
const SCALE = {
  MIN: 0.5,
  MAX: 2.0,
  DEFAULT: 1.0,
  STEP: 0.1
};

function OutputPreview({ previewUrl, format, customStyles = {} }) {
  const [content, setContent] = useState('');
  const [scale, setScale] = useState(SCALE.DEFAULT);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const contentRef = useRef(null);
  const containerRef = useRef(null);
  
  // Get format info
  const formatInfo = useMemo(() => {
    const formatKey = format?.toLowerCase();
    return FORMAT_CONFIG[formatKey] || FORMAT_CONFIG.default;
  }, [format]);
  
  // Fetch preview content with better error handling
  const fetchPreview = useCallback(async (url) => {
    if (!url) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Add cache-busting parameter for deployed environments
      const fetchUrl = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
      
      const response = await fetch(fetchUrl, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch preview (Status: ${response.status})`);
      }
      
      const html = await response.text();
      setContent(html);
      
      // Apply fit width after content is loaded
      requestAnimationFrame(() => {
        if (containerRef.current && contentRef.current) {
          fitWidth();
        }
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Error fetching preview:', error);
      setError(error.message || 'Failed to load preview');
      setIsLoading(false);
    }
  }, []);
  
  // Effect for fetching content
  useEffect(() => {
    fetchPreview(previewUrl);
  }, [previewUrl, fetchPreview]);
  
  // Zoom controls
  const zoomIn = () => {
    if (scale < SCALE.MAX) {
      setScale(prev => Math.min(prev + SCALE.STEP, SCALE.MAX));
    }
  };
  
  const zoomOut = () => {
    if (scale > SCALE.MIN) {
      setScale(prev => Math.max(prev - SCALE.STEP, SCALE.MIN));
    }
  };
  
  const resetZoom = () => setScale(SCALE.DEFAULT);
  
  // Improved fitWidth with better error handling
  const fitWidth = useCallback(() => {
    try {
      if (!contentRef.current || !containerRef.current) return;
      
      const container = containerRef.current;
      const content = contentRef.current;
      
      // Check if elements have dimensions
      if (content.scrollWidth > 0 && container.clientWidth > 0) {
        const contentWidth = content.scrollWidth;
        const containerWidth = container.clientWidth - 40; // Account for padding
        
        // Calculate new scale but limit to min/max
        const newScale = Math.min(
          Math.max(containerWidth / contentWidth, SCALE.MIN),
          SCALE.MAX
        );
        
        setScale(newScale);
      }
    } catch (err) {
      console.warn('Error in fitWidth:', err);
      // Fallback to default scale on error
      setScale(SCALE.DEFAULT);
    }
  }, []);
  
  // Enhanced print function with better browser compatibility
  const printPreview = useCallback(() => {
    if (!content) return;
    
    try {
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        alert('Please allow pop-ups for printing functionality');
        return;
      }
      
      // Create a more robust print view
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
            <script>
              // Auto print after content is loaded
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  setTimeout(function() { window.close(); }, 100);
                }, 300);
              }
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
    } catch (error) {
      console.error('Error printing preview:', error);
      alert('Failed to open print preview. Please check your browser settings.');
    }
  }, [content, format]);
  
  // Add window resize listener with debounce
  useEffect(() => {
    let resizeTimer;
    
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(fitWidth, 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, [fitWidth]);
  
  // Apply custom styles
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
            <button 
              className="retry-button"
              onClick={() => fetchPreview(previewUrl)}
            >
              Retry
            </button>
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