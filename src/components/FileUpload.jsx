import { useState, useRef } from 'react';

function FileUpload({ onFileSelect }) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileSelected, setFileSelected] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0] && e.dataTransfer.files[0].type === 'application/pdf') {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    setFileName(file.name);
    setFileSelected(true);
    onFileSelect(file);
  };

  const removeFile = (e) => {
    e.stopPropagation();
    setFileName('');
    setFileSelected(false);
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div 
      className={`file-upload ${dragActive ? 'active' : ''} ${fileSelected ? 'file-selected' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => !fileSelected && inputRef.current.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      
      {!fileSelected ? (
        <>
          <div className="upload-icon">
            <i className="bi bi-cloud-arrow-up-fill"></i>
          </div>
          <div className="file-upload-text">
            <strong>Choose a PDF file</strong> or drag it here
          </div>
          <button className="file-upload-button">
            Browse Files
          </button>
        </>
      ) : (
        <div className="selected-file">
          <div className="file-icon">
            <i className="bi bi-file-earmark-pdf-fill"></i>
          </div>
          <div className="file-details">
            <div className="file-name">{fileName}</div>
            <div className="file-action">
              <button 
                className="remove-file"
                onClick={removeFile}
              >
                <i className="bi bi-x-circle"></i> Change PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUpload;