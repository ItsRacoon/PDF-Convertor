import { useState, useEffect } from 'react';

function PdfPreview({ file }) {
  const [fileName, setFileName] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!file) return;
    
    setFileName(file.name);
    setIsLoading(true);
    setError(null);
    
    // Create a simple object URL for the PDF
    try {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Clean up the URL when component unmounts or file changes
      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (err) {
      console.error('Error creating preview URL:', err);
      setError('Could not generate preview');
    } finally {
      setIsLoading(false);
    }
  }, [file]);
  
  return (
    <div className="pdf-preview-section">
      <div className="pdf-preview-header">
        <h3 className="pdf-preview-title">PDF Preview</h3>
        <div className="pdf-preview-filename">{fileName}</div>
      </div>
      
      <div className="pdf-viewer-container">
        {isLoading ? (
          <div className="pdf-loading">
            <div className="pdf-spinner"></div>
            <p>Loading preview...</p>
          </div>
        ) : error ? (
          <div className="pdf-error">
            <p>{error}</p>
          </div>
        ) : previewUrl ? (
          <div className="pdf-embed-container">
            <object
              data={previewUrl}
              type="application/pdf"
              width="100%"
              height="500px"
              className="pdf-object"
            >
              <p>
                Your browser doesn't support PDF previews.
                <a href={previewUrl} target="_blank" rel="noreferrer">
                  Click here to download the PDF
                </a>
              </p>
            </object>
          </div>
        ) : (
          <div className="pdf-placeholder">
            <p>Select a PDF file to preview</p>
          </div>
        )}
      </div>

      <style>{`
        .pdf-preview-section {
          display: flex;
          flex-direction: column;
          width: 100%;
          background-color: #f5f7fa;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          margin-bottom: 20px;
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