const fs = require('fs');
const files = [
  "src/pages/Dashboard.jsx",
  "src/pages/Lending.jsx",
  "src/pages/Reports.jsx",
  "src/pages/Transfers.jsx",
  "src/pages/Workers.jsx",
  "src/pages/inventory/ToolDetail.jsx",
  "src/pages/inventory/ToolsList.jsx",
  "src/pages/procurement/Purchases.jsx",
  "src/pages/procurement/Suppliers.jsx",
  "src/pages/settings/SystemSettings.jsx",
  "src/pages/settings/UserManagement.jsx"
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let txt = fs.readFileSync(f, 'utf8');
    const regex = /(\s*<\/[a-zA-Z0-9]+>\s*)\)\s*\}[\s]*$/;
    if (regex.test(txt)) {
      txt = txt.replace(regex, "$1\n    </ErrorBoundary>\n  )\n}\n");
      fs.writeFileSync(f, txt, 'utf8');
      console.log('Fixed', f);
    } else {
      console.log('Regex missed', f);
    }
  }
});
