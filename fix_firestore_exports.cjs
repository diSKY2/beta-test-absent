const fs = require('fs');
let code = fs.readFileSync('src/lib/firestoreClient.ts', 'utf-8');

const replacement = `export async function getDoc(docRef: any) {
  const res = await fetch(API_BASE_URL + '/api/sql/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'getDoc', collection: docRef.name, docId: docRef.id })
  });
  if (!res.ok) throw new Error(await res.text());
  
  const parsedResponse = await res.json();
  if (!parsedResponse) return { exists: () => false, data: () => null };
  return { exists: () => true, data: () => parsedResponse };
}
`;

code += "\n" + replacement;
fs.writeFileSync('src/lib/firestoreClient.ts', code);
console.log('Done');
