import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import fs from "fs";

const cfg = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(cfg);
const db = getFirestore(app);

async function run() {
  try {
    const q1Hist = query(collection(db, 'leave_requests'), where('status', 'in', ['Approved', 'Rejected']));
    const snap = await getDocs(q1Hist);
    console.log("Leaves:", snap.size);
  } catch (e) {
    console.error("Leaves Error:", e);
  }
  process.exit(0);
}
run();
