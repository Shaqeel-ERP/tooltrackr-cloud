const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already has ErrorBoundary
  if (content.includes('import ErrorBoundary')) return;

  // We only want to wrap the main exported page component.
  // Look for `export function ComponentName() { ... return ( <div ... > ... ) }`
  // We'll just do a smart string replacement.

  // 1. Add import at the top
  const importStatement = `import ErrorBoundary from "@/components/shared/ErrorBoundary"\n`;
  content = importStatement + content;

  // 2. Find the main return statement of the component.
  // Most pages have a structure like:
  // return (
  //   <div className="flex flex-col gap-6...">
  //     ...
  //   </div>
  // )
  // We replace the outer div with ErrorBoundary wrap.
  
  // This is a bit tricky with Regex. Let's do a simple replace on the first `return (` inside the export function.
  // Actually, some components return early on isLoading. We want to wrap the final return.
  
  // A safer approach for a script is to just wrap the whole body of the return if it's the main component.
  // Let's rely on the fact that the final return is usually at the end of the file:
  // return (
  //   <div className="flex flex-col gap-6">
  //     <PageHeader ...
  
  const returnMatch = content.match(/return\s*\(\s*<div/);
  if (returnMatch) {
     const splitIndex = content.lastIndexOf('return (');
     if (splitIndex !== -1) {
        const top = content.substring(0, splitIndex);
        const bottom = content.substring(splitIndex);
        
        // We need to replace the outermost JSX.
        // It's easier to just wrap it:
        const newBottom = bottom.replace(/return\s*\(\s*(<[A-Za-z0-9]+[^>]*>)/, 'return (\n    <ErrorBoundary>\n      $1');
        
        // Find the last closing tag before the end of the file.
        // Usually it's `    </div>\n  )\n}`
        const finalContent = top + newBottom.replace(/(\s*<\/[A-Za-z0-9]+>\s*)\)\s*\}$/, '$1\n    </ErrorBoundary>\n  )\n}');
        
        if (finalContent !== content) {
           fs.writeFileSync(filePath, finalContent, 'utf8');
           console.log('Processed', filePath);
        }
     }
  }
}

processDirectory(pagesDir);
console.log('Done');
