const fs = require('fs');
const babel = require('@babel/core');
try {
  babel.transformSync(fs.readFileSync('src/pages/EmployeePortal.tsx', 'utf8'), {
    presets: ['@babel/preset-react', '@babel/preset-typescript']
  });
  console.log('JSX is valid');
} catch (e) {
  console.error(e.message);
}
