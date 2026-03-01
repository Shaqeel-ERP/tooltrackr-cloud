const fs = require('fs');
const path = require('path');

const replacements = {
  'tool_locations': 'toollocations',
  'stock_movements': 'stockmovements',
  'purchase_items': 'purchaseitems',
  'transfer_items': 'transferitems',
  'tool_maintenance': 'toolmaintenance',
  'audit_log': 'auditlog',
  'reserved_quantity': 'reservedquantity',
  'job_site': 'jobsite'
};

const dirsToScan = [
  path.join(__dirname, 'src', 'routes'),
  path.join(__dirname, 'src', 'lib')
];

let filesToProcess = [];

dirsToScan.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    files.forEach(f => {
      if (f.endsWith('.js')) {
        filesToProcess.push(path.join(dir, f));
      }
    });
  }
});

filesToProcess.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  for (const [wrong, correct] of Object.entries(replacements)) {
    const regex = new RegExp('\\b' + wrong + '\\b', 'g');
    content = content.replace(regex, correct);
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
  }
});
