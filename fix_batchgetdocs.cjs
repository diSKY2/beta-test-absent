const fs = require('fs');
let code = fs.readFileSync('server/firestoreAdapter.ts', 'utf-8');

const tableCheckRegex = /if \(\!table\) \{\n\s*return res\.status\(400\)\.json\(\{ error: 'Collection not defined in schema: ' \+ collection \}\);\n\s*\}/;
const replacement = `if (action === 'batchGetDocs') {
      const { batch } = req.body;
      const results = await Promise.all(batch.map((b: any) => processGetDocs(b.collection, b.filters, b.queries)));
      return res.json(results);
    }
    
    if (!table) {
      return res.status(400).json({ error: 'Collection not defined in schema: ' + collection });
    }`;

// First remove the old batchGetDocs
const oldBatchGetRegex = /if \(action === 'batchGetDocs'\) \{\n\s*const \{ batch \} = req\.body;\n\s*const results = await Promise\.all\(batch\.map\(\(b: any\) => processGetDocs\(b\.collection, b\.filters, b\.queries\)\)\);\n\s*return res\.json\(results\);\n\s*\}/;
code = code.replace(oldBatchGetRegex, '');
code = code.replace(tableCheckRegex, replacement);

fs.writeFileSync('server/firestoreAdapter.ts', code);
console.log('Done');
