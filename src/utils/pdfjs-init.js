import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker for PDF.js
// Use a local worker file to avoid CORS issues
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

export default pdfjsLib;