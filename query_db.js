import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, getDoc, doc } from "firebase/firestore";
import fs from "fs";

const cfg = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));

const app = initializeApp(cfg);
const db = getFirestore(app);

async function run() {
  const querySnapshot = await getDocs(collection(db, "attendances"));
  let count = 0;
  querySnapshot.forEach((doc) => {
    console.log(doc.id, " => ", doc.data());
    count++;
  });
  console.log("Total:", count);
  process.exit(0);
}
run();
