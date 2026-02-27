
const fs = require('node:fs');
const ts = require('typescript');

const fileName = 'src/components/Core/constants.ts';
const sourceCode = fs.readFileSync(fileName, 'utf8');

const sourceFile = ts.createSourceFile(
  fileName,
  sourceCode,
  ts.ScriptTarget.Latest,
  true
);

let foundNavItems = false;
let foundGoogleSheets = false;

function visit(node) {
  if (ts.isVariableStatement(node)) {
    node.declarationList.declarations.forEach(declaration => {
      if (ts.isIdentifier(declaration.name)) {
        if (declaration.name.text === 'NAV_ITEMS') {
          foundNavItems = true;
        }
        if (declaration.name.text === 'GOOGLE_SHEETS_CONFIG') {
          foundGoogleSheets = true;
        }
      }
    });
  }
  ts.forEachChild(node, visit);
}

visit(sourceFile);

if (foundNavItems && !foundGoogleSheets) {
  console.log('SUCCESS: NAV_ITEMS found and GOOGLE_SHEETS_CONFIG removed.');
} else {
  console.error('FAILURE:');
  if (!foundNavItems) console.error('- NAV_ITEMS missing');
  if (foundGoogleSheets) console.error('- GOOGLE_SHEETS_CONFIG still present');
  process.exit(1);
}
