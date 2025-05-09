import { useState } from 'react';
import './App.css';
import FileUpload from './components/FileUpload';
import PdfPreview from './components/PdfPreview';
import FormatSelector from './components/FormatSelector';
import OutputPreview from './components/OutputPreview';
import ConversionStatus from './components/ConversionStatus';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [conversionResult, setConversionResult] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState(null);
  
  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setConversionResult(null);
    setError(null);
  };
  
  const handleFormatSelect = (format) => {
    setSelectedFormat(format);
    setConversionResult(null);
    setError(null);
  };
  
  const handleConvert = async () => {
    if (!selectedFile || !selectedFormat) return;
    
    setIsConverting(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('format', selectedFormat);
    
    try {
      const response = await fetch('https://pdf-convertor-4jah.onrender.com/convert', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Conversion failed');
      }
      
      setConversionResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsConverting(false);
    }
  };
  
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>PDF Converter</h1>
        <p className="subtitle">Convert your PDF files to DOCX, CSV, or XLSX format</p>
      </header>
      
      <main className="app-main">
        <div className="conversion-panel">
          <div className="input-section">
            <FileUpload onFileSelect={handleFileSelect} />
            
            {selectedFile && (
              <div className="preview-section">
                <h3>PDF Preview</h3>
                <PdfPreview file={selectedFile} />
              </div>
            )}
          </div>
          
          <div className="conversion-section">
            <FormatSelector 
              onFormatSelect={handleFormatSelect} 
              selectedFormat={selectedFormat}
              onConvert={handleConvert}
              disabled={!selectedFile || !selectedFormat || isConverting}
              isConverting={isConverting}
            />
            
            <ConversionStatus 
              result={conversionResult} 
              error={error} 
              isConverting={isConverting} 
            />
          </div>
        </div>
        
        {conversionResult && (
          <div className="output-section">
            <h3>Converted File Preview</h3>
            <OutputPreview 
              previewUrl={conversionResult.preview_url} 
              format={conversionResult.format}
            />
          </div>
        )}
      </main>
      
      <footer className="app-footer">
        <p>PDF Converter © 2025</p>
      </footer>
    </div>
  );
}

export default App;