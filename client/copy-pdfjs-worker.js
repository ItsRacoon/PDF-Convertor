// CommonJS module
const fs = require('fs');
const path = require('path');

// Path to the PDF.js worker file in node_modules
const sourceWorkerPath = path.resolve(
  __dirname,
  'node_modules',
  'pdfjs-dist',
  'build',
  'pdf.worker.min.js'
);

// Path to the destination in the public directory
const destWorkerPath = path.resolve(__dirname, 'public', 'pdf.worker.js');

// Copy the worker file
try {
  const workerContent = fs.readFileSync(sourceWorkerPath);
  fs.writeFileSync(destWorkerPath, workerContent);
  console.log('PDF.js worker file copied successfully!');
} catch (error) {
  console.error('Error copying PDF.js worker file:', error);
  process.exit(1);
}