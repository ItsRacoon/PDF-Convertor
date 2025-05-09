import { useState, useEffect, useMemo } from 'react';
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

function OutputPreview({ previewUrl, format, customStyles = {} }) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get format info
  const formatInfo = useMemo(() => {
    const formatKey = format?.toLowerCase();
    return FORMAT_CONFIG[formatKey] || FORMAT_CONFIG.default;
  }, [format]);
  
  // Fetch preview content
  useEffect(() => {
    if (!previewUrl) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const fetchData = async () => {
      try {
        // Add cache-busting parameter
        const fetchUrl = `${previewUrl}${previewUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
        
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
      } catch (error) {
        console.error('Error fetching preview:', error);
        setError(error.message || 'Failed to load preview');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [previewUrl]);
  
  // Simple print function
  const printPreview = () => {
    if (!content) return;
    
    try {
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        alert('Please allow pop-ups for printing functionality');
        return;
      }
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Print ${format?.toUpperCase() || 'Document'}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              table { border-collapse: collapse; width: 100%; }
              table, th, td { border: 1px solid #ddd; }
              th, td { padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              img { max-width: 100%; height: auto; }
              @media print {
                body { margin: 0; padding: 15px; }
              }
            </style>
          </head>
          <body>
            ${content}
            <script>
              window.onload = function() {
                setTimeout(function() { window.print(); }, 200);
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
  };
  
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
          >
            <i className="bi bi-printer-fill"></i>
          </button>
        </div>
      </div>
      
      <div className="output-viewer">
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
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}
        
        {!isLoading && !error && content && (
          <div 
            className="preview-content"
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
    </div>
  );
}

export default OutputPreview;

