const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data.md');
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`File exists. Length: ${content.length} chars`);
  console.log('Snippet:\n', content.substring(0, 500));
} else {
  console.log('File does not exist at ' + filePath);
}
process.exit();
