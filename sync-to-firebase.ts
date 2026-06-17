import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";
import fs from 'fs';
import { db } from './src/db/index.js';
import * as schema from './src/db/schema.js';

const firebaseConfigData = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));

const app = initializeApp(firebaseConfigData);
const fbDb = getFirestore(app, "ai-studio-77c53dd2-ef2c-45b2-81fb-7589e960e386");

async function main() {
  console.log("Syncing employees...");
  try {
      const emps = await db.select().from(schema.employees);
      for (const emp of emps) {
        try {
          await setDoc(doc(fbDb, "employees", emp.id), emp, { merge: true });
          console.log("Synced employee", emp.name);
        } catch(e) { console.error("Error employee", e); }
      }
  } catch (e) {
      console.error(e);
  }

  console.log("Syncing sub_departments...");
  try {
      const subs = await db.select().from(schema.subDepartments);
      for (const sub of subs) {
        try {
          const s = {...sub};
          if (s.createdAt) s.createdAt = (s.createdAt as Date).getTime() as any;
          if (s.updatedAt) s.updatedAt = (s.updatedAt as Date).getTime() as any;
          await setDoc(doc(fbDb, "sub_departments", sub.id), s, { merge: true });
          console.log("Synced sub", sub.name);
        } catch(e) { console.error("Error sub", e); }
      }
  } catch(e) {}
  
  console.log("Syncing departments...");
  try {
     const deps = await db.select().from(schema.departments);
     for (const d of deps) {
       const ds = {...d};
       if (ds.createdAt) ds.createdAt = (ds.createdAt as Date).getTime() as any;
       if (ds.updatedAt) ds.updatedAt = (ds.updatedAt as Date).getTime() as any;
       await setDoc(doc(fbDb, "departments", d.id), ds, { merge: true });
       console.log("Synced dep", d.name);
     }
  } catch(e){}
  
  console.log("Syncing schedules...");
  try {
     const scheds = await db.select().from(schema.schedules);
     for (const s of scheds) {
       const ss = {...s};
       if (ss.date) ss.date = (ss.date as Date).getTime() as any;
       if (ss.createdAt) ss.createdAt = (ss.createdAt as Date).getTime() as any;
       if (ss.updatedAt) ss.updatedAt = (ss.updatedAt as Date).getTime() as any;
       await setDoc(doc(fbDb, "schedules", s.id), ss, { merge: true });
       console.log("Synced schedule", s.id);
     }
  } catch(e){}
  
  console.log("Syncing attendances...");
  try {
     const atts = await db.select().from(schema.attendances);
     for (const a of atts) {
       const as = {...a};
       if (as.date) as.date = (as.date as Date).getTime() as any;
       if (as.createdAt) as.createdAt = (as.createdAt as Date).getTime() as any;
       if (as.updatedAt) as.updatedAt = (as.updatedAt as Date).getTime() as any;
       await setDoc(doc(fbDb, "attendances", a.id), as, { merge: true });
       console.log("Synced attendance", a.id);
     }
  } catch(e){}

  console.log("Done syncing");
  process.exit(0);
}
main();
