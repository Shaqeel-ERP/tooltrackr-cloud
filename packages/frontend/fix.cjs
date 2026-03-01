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
    const lastReturn = txt.lastIndexOf('  )\n}');
    if (lastReturn !== -1) {
      txt = txt.substring(0, lastReturn) + '    </ErrorBoundary>\n' + txt.substring(lastReturn);
      fs.writeFileSync(f, txt, 'utf8');
      console.log('Fixed', f);
    } else {
      console.log('Could not find return match for', f);
    }
  }
});
