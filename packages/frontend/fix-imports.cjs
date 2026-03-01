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

  // Replace all relative imports pointing to components, lib, hooks
  // e.g. from "../../components/..."
  content = content.replace(/from\s+['"](?:\.\.\/)+components\/([^'"]+)['"]/g, 'from "@/components/$1"');
  content = content.replace(/from\s+['"](?:\.\.\/)+lib\/([^'"]+)['"]/g, 'from "@/lib/$1"');
  content = content.replace(/from\s+['"](?:\.\.\/)+hooks\/([^'"]+)['"]/g, 'from "@/hooks/$1"');

  // Also handle single dot e.g. from "./components/..."
  content = content.replace(/from\s+['"]\.\/components\/([^'"]+)['"]/g, 'from "@/components/$1"');
  content = content.replace(/from\s+['"]\.\/lib\/([^'"]+)['"]/g, 'from "@/lib/$1"');
  content = content.replace(/from\s+['"]\.\/hooks\/([^'"]+)['"]/g, 'from "@/hooks/$1"');

  // Also handle dynamic imports import("../../components/...")
  content = content.replace(/import\s*\(\s*['"](?:\.\.\/)+components\/([^'"]+)['"]\s*\)/g, 'import("@/components/$1")');
  content = content.replace(/import\s*\(\s*['"](?:\.\.\/)+lib\/([^'"]+)['"]\s*\)/g, 'import("@/lib/$1")');
  content = content.replace(/import\s*\(\s*['"](?:\.\.\/)+hooks\/([^'"]+)['"]\s*\)/g, 'import("@/hooks/$1")');

  content = content.replace(/import\s*\(\s*['"]\.\/components\/([^'"]+)['"]\s*\)/g, 'import("@/components/$1")');
  content = content.replace(/import\s*\(\s*['"]\.\/lib\/([^'"]+)['"]\s*\)/g, 'import("@/lib/$1")');
  content = content.replace(/import\s*\(\s*['"]\.\/hooks\/([^'"]+)['"]\s*\)/g, 'import("@/hooks/$1")');


  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
