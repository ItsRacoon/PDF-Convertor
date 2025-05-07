import { useState } from 'react';

function FormatSelector({ onFormatSelect, selectedFormat, onConvert, disabled, isConverting }) {
  const formats = [
    { 
      id: 'docx', 
      label: 'DOCX', 
      description: 'Best for text documents with formatting', 
      icon: 'bi-file-earmark-word-fill'
    },
    { 
      id: 'csv', 
      label: 'CSV', 
      description: 'Simple tabular data format', 
      icon: 'bi-file-earmark-spreadsheet-fill'
    },
    { 
      id: 'xlsx', 
      label: 'XLSX', 
      description: 'Excel spreadsheet with multiple sheets', 
      icon: 'bi-file-earmark-excel-fill'
    }
  ];
  
  return (
    <div className="format-selector">
      <h3>
        <i className="bi bi-arrow-right-circle me-2"></i>
        Select Output Format
      </h3>
      
      <div className="format-options">
        {formats.map(format => (
          <div
            key={format.id}
            className={`format-option ${selectedFormat === format.id ? 'selected' : ''}`}
            onClick={() => onFormatSelect(format.id)}
          >
            <div className="format-option-icon">
              <i className={`bi ${format.icon}`}></i>
            </div>
            <div className="format-option-label">{format.label}</div>
            <div className="format-option-description">{format.description}</div>
            {selectedFormat === format.id && (
              <div className="selected-indicator">
                <i className="bi bi-check-circle-fill"></i>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <button 
        className="convert-button" 
        onClick={onConvert} 
        disabled={disabled}
      >
        {isConverting ? (
          <>
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            <span>Converting...</span>
          </>
        ) : (
          <>
            <i className="bi bi-lightning-charge-fill me-2"></i>
            <span>Convert PDF to {selectedFormat ? selectedFormat.toUpperCase() : 'Document'}</span>
          </>
        )}
      </button>
    </div>
  );
}

export default FormatSelector;