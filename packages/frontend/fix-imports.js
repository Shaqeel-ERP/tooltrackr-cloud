const fs = require('fs');
const path = require('path');

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

const files = walk(path.join(__dirname, 'src'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace ui/
  content = content.replace(/from\s+['"](?:\.\.?\/)+ui\/([^'"]+)['"]/g, 'from "@/components/ui/$1"');
  // Replace shared/
  content = content.replace(/from\s+['"](?:\.\.?\/)+shared\/([^'"]+)['"]/g, 'from "@/components/shared/$1"');
  // Replace lib/
  content = content.replace(/from\s+['"](?:\.\.?\/)+lib\/([^'"]+)['"]/g, 'from "@/lib/$1"');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
