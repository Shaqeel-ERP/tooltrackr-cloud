const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace common light hardcoded classes with Tailwind variables
  content = content.replace(/\bbg-white\b/g, 'bg-background');
  
  // For page backgrounds and muted sections
  content = content.replace(/\bbg-slate-50\b(?!\/[0-9])/g, 'bg-muted');
  
  // For borders
  content = content.replace(/\bborder-slate-200\b/g, 'border-border');
  content = content.replace(/\bborder-slate-100\b/g, 'border-border');

  // For text
  content = content.replace(/\btext-slate-900\b/g, 'text-foreground');
  content = content.replace(/\btext-slate-800\b/g, 'text-foreground');
  content = content.replace(/\btext-slate-600\b/g, 'text-muted-foreground');
  content = content.replace(/\btext-slate-500\b/g, 'text-muted-foreground');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      processFile(fullPath);
    }
  }
}

walkDir(path.join(__dirname, 'src', 'pages'));
walkDir(path.join(__dirname, 'src', 'components', 'layout'));
walkDir(path.join(__dirname, 'src', 'components', 'shared'));
walkDir(path.join(__dirname, 'src', 'components', 'inventory'));
walkDir(path.join(__dirname, 'src', 'components', 'transfers'));

console.log('Done replacing hardcoded classes.');
