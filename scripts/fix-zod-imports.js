#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create a zod/v4 directory in node_modules
const zodV4Path = path.join(__dirname, '..', 'node_modules', 'zod', 'v4');

// Create the directory if it doesn't exist
if (!fs.existsSync(zodV4Path)) {
  fs.mkdirSync(zodV4Path, { recursive: true });
}

// Create index.js that re-exports zod (CommonJS)
const indexContent = `
const zod = require('..');
module.exports = zod;
module.exports.z = zod.z;
`;

fs.writeFileSync(path.join(zodV4Path, 'index.js'), indexContent);

// Create index.mjs that re-exports zod (ESM)
const mjsContent = `
export * from '..';
export { z } from '..';
export { default } from '..';
`;

fs.writeFileSync(path.join(zodV4Path, 'index.mjs'), mjsContent);

// Create index.d.ts that re-exports zod types
const dtsContent = `
export * from '..';
export { z } from '..';
export { default } from '..';
`;

fs.writeFileSync(path.join(zodV4Path, 'index.d.ts'), dtsContent);

// Create package.json for the v4 folder
const packageContent = {
  "name": "zod-v4",
  "main": "./index.js",
  "module": "./index.mjs",
  "types": "./index.d.ts",
  "exports": {
    ".": {
      "types": "./index.d.ts",
      "import": "./index.mjs",
      "require": "./index.js"
    }
  }
};

fs.writeFileSync(path.join(zodV4Path, 'package.json'), JSON.stringify(packageContent, null, 2));

console.log('Created zod/v4 alias successfully');