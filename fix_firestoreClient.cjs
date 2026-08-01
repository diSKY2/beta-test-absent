const fs = require('fs');
let code = fs.readFileSync('src/lib/firestoreClient.ts', 'utf-8');

code = code.replace(/import \{ initializeApp as realInitializeApp \} from "firebase\/app";\n/, '');
code = code.replace(/import \{ getFirestore as realGetFirestore, collection as realFbCollection, doc as realFbDoc, setDoc as realFbSetDoc, addDoc as realFbAddDoc, updateDoc as realFbUpdateDoc, deleteDoc as realFbDeleteDoc, writeBatch as realFbWriteBatch, getDocs as realFbGetDocs \} from "firebase\/firestore";\n/, '');
code = code.replace(/import firebaseConfigData from '\.\.\/\.\.\/firebase-applet-config\.json';\n/, '');
code = code.replace(/const realApp = realInitializeApp\(firebaseConfigData\);\n/, '');
code = code.replace(/const realDb = realGetFirestore\(realApp, firebaseConfigData\.firestoreDatabaseId \|\| "\(\default\)"\);\n/, '');

const dualWriteRegexAddDoc = /\s*\/\/ Dual write to real Firebase so mobile app stays synced\n\s*try \{\n\s*const realRef = realFbDoc\(realDb, col\.name, idFromPg\);\n\s*await realFbSetDoc\(realRef, data\);\n\s*\} catch \(e\) \{ console\.error\("Firebase sync error on addDoc", e\); \}/;
code = code.replace(dualWriteRegexAddDoc, '');

const dualWriteRegexBatchSetDocs = /\s*try \{\n\s*const batch = realFbWriteBatch\(realDb\);\n\s*docs\.forEach\(d => \{\n\s*const realRef = realFbDoc\(realDb, collectionName, d\.id\);\n\s*batch\.set\(realRef, d\.data, \{ merge: true \}\);\n\s*\}\);\n\s*await batch\.commit\(\);\n\s*\} catch \(e\) \{ console\.error\("Firebase sync error on batchSetDocs", e\); \}/;
code = code.replace(dualWriteRegexBatchSetDocs, '');

const dualWriteRegexSetDoc = /\s*try \{\n\s*const realRef = realFbDoc\(realDb, docObj\.name, docObj\.id\);\n\s*await realFbSetDoc\(realRef, data, options \|\| \{\}\);\n\s*\} catch \(e\) \{ console\.error\("Firebase sync error on setDoc", e\); \}/;
code = code.replace(dualWriteRegexSetDoc, '');

const dualWriteRegexUpdateDoc = /\s*try \{\n\s*const realRef = realFbDoc\(realDb, docObj\.name, docObj\.id\);\n\s*await realFbUpdateDoc\(realRef, data\);\n\s*\} catch \(e\) \{ console\.error\("Firebase sync error on updateDoc", e\); \}/;
code = code.replace(dualWriteRegexUpdateDoc, '');

const dualWriteRegexDeleteDoc = /\s*try \{\n\s*const realRef = realFbDoc\(realDb, docObj\.name, docObj\.id\);\n\s*await realFbDeleteDoc\(realRef\);\n\s*\} catch \(e\) \{ console\.error\("Firebase sync error on deleteDoc", e\); \}/;
code = code.replace(dualWriteRegexDeleteDoc, '');

fs.writeFileSync('src/lib/firestoreClient.ts', code);
console.log('Done!');
