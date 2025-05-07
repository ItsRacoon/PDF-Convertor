function ConversionStatus({ result, error, isConverting }) {
  if (isConverting) {
    return (
      <div className="conversion-status">
        <div className="status-indicator processing">
          <div className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></div>
        </div>
        <div className="status-content">
          <h4 className="status-title">Processing your PDF</h4>
          <p className="status-message">Please wait while we convert your document...</p>
          <div className="progress">
            <div 
              className="progress-bar progress-bar-striped progress-bar-animated" 
              role="progressbar" 
              style={{ width: '100%' }}
            ></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="conversion-status">
        <div className="status-indicator error">
          <i className="bi bi-exclamation-circle-fill"></i>
        </div>
        <div className="status-content">
          <h4 className="status-title">Conversion Failed</h4>
          <p className="status-message">{error}</p>
          <p className="status-help">Please try again or choose a different format.</p>
        </div>
      </div>
    );
  }
  
  if (result) {
    return (
      <div className="conversion-status">
        <div className="status-indicator success">
          <i className="bi bi-check-circle-fill"></i>
        </div>
        <div className="status-content">
          <h4 className="status-title">Conversion Successful!</h4>
          <p className="status-message">
            Your PDF has been converted to {result.format.toUpperCase()} format.
          </p>
          <a 
            href={result.download_url} 
            download 
            className="download-button"
          >
            <i className="bi bi-download me-2"></i>
            Download {result.filename}
          </a>
        </div>
      </div>
    );
  }
  
  return null;
}

export default ConversionStatus;