import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import path from 'path';

function walkDir(dir) {
  let results = [];
  const list = readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walkDir(file));
    } else { 
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walkDir('src');

let count = 0;
files.forEach(file => {
  let content = readFileSync(file, 'utf-8');
  let original = content;
  
  // Calculate relative path to src/lib/firestoreClient
  const dir = path.dirname(file);
  let relPath = path.relative(dir, 'src/lib/firestoreClient').replace(/\\/g, '/');
  if (!relPath.startsWith('.')) relPath = './' + relPath;

  content = content.replace(/from\s+['"]firebase\/firestore['"]/g, `from '${relPath}'`);
  content = content.replace(/from\s+['"]firebase\/auth['"]/g, `from '${relPath}'`);
  content = content.replace(/from\s+['"]firebase\/storage['"]/g, `from '${relPath}'`);
  content = content.replace(/from\s+['"]firebase\/app['"]/g, `from '${relPath}'`);
  
  content = content.replace(/from\s+['"]\.\.\/lib\/firebase['"]/g, `from '${relPath}'`);
  content = content.replace(/from\s+['"]\.\.\/\.\.\/lib\/firebase['"]/g, `from '${relPath}'`);
  
  if (original !== content) {
    writeFileSync(file, content);
    count++;
  }
});

console.log('Replaced firebase imports in ' + count + ' files.');
