// copy-pdfjs-worker.cjs
const fs = require('fs');
const path = require('path');

// First, let's create the public directory if it doesn't exist
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Different possible paths to check for the worker file
const possiblePaths = [
  // Path for newer versions of pdfjs-dist
  path.join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.js'),
  // Path for newer ESM versions
  path.join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs'),
  // Path for older versions
  path.join(__dirname, 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.min.js'),
  // Another possible location
  path.join(__dirname, 'node_modules', 'pdfjs-dist', 'webpack', 'pdf.worker.min.js'),
];

let sourcePath = null;

// Find the first path that exists
for (const potentialPath of possiblePaths) {
  if (fs.existsSync(potentialPath)) {
    sourcePath = potentialPath;
    break;
  }
}

if (!sourcePath) {
  console.error('Could not find pdf.worker file in any of the expected locations.');
  console.log('Available files in pdfjs-dist build directory:');
  
  try {
    const buildDir = path.join(__dirname, 'node_modules', 'pdfjs-dist', 'build');
    if (fs.existsSync(buildDir)) {
      console.log(fs.readdirSync(buildDir));
    } else {
      console.log('build directory does not exist');
      // Let's check what directories do exist
      const pdfJsDir = path.join(__dirname, 'node_modules', 'pdfjs-dist');
      if (fs.existsSync(pdfJsDir)) {
        console.log('Available directories in pdfjs-dist:');
        console.log(fs.readdirSync(pdfJsDir));
      }
    }
  } catch (err) {
    console.error('Error listing directory contents:', err);
  }
  
  process.exit(1);
}

const destPath = path.join(publicDir, 'pdf.worker.min.js');

try {
  const data = fs.readFileSync(sourcePath);
  fs.writeFileSync(destPath, data);
  console.log(`Successfully copied PDF.js worker file from ${sourcePath} to ${destPath}`);
} catch (err) {
  console.error('Error copying PDF.js worker file:', err);
  process.exit(1);
}