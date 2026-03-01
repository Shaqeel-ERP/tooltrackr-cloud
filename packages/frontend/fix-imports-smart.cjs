const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(srcDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Match `from "../something"` and `import("../something")`
    const importRegex = /(from\s+|import\()(['"])(\.\.[^'"]+)(['"])/g;

    content = content.replace(importRegex, (match, prefix, quote1, importPath, quote2) => {
        // resolve absolute path of what is being imported
        const absoluteImportPath = path.resolve(path.dirname(file), importPath);

        // see if it is inside srcDir
        if (absoluteImportPath.startsWith(srcDir)) {
            // get relative to srcDir
            let relToSrc = path.relative(srcDir, absoluteImportPath);
            // turn backslashes to forward slashes
            relToSrc = relToSrc.replace(/\\/g, '/');
            return `${prefix}${quote1}@/${relToSrc}${quote2}`;
        }
        return match;
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
