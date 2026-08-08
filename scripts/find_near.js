const fs = require('fs');
const path = require('path');

function searchDir(dir, query) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.next') {
        searchDir(fullPath, query);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.mjs')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.toLowerCase().includes(query.toLowerCase())) {
        console.log(`Found "${query}" in: ${fullPath}`);
      }
    }
  }
}

console.log('Searching for "near" references...');
searchDir('c:\\Users\\hp\\Downloads\\Cairn-ClearRail\\app', 'near');
searchDir('c:\\Users\\hp\\Downloads\\Cairn-ClearRail\\components', 'near');
searchDir('c:\\Users\\hp\\Downloads\\Cairn-ClearRail\\lib', 'near');
