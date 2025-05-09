// In your JavaScript where you initialize PDF.js
import * as pdfjs from 'pdfjs-dist';

// Change this line
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';  // Use the file you already copied
// Set up the worker for PDF.js
// Use a local worker file to avoid CORS issues


export default pdfjsLib;