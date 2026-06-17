import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, query, where, deleteDoc } from "firebase/firestore";

const cfg = {
  apiKey: "AIzaSyCYZ57fun9z9h_1sl9IUrVxQCpGKjSlysU",
  authDomain: "digitalgtp-6b713.firebaseapp.com",
  projectId: "digitalgtp-6b713",
  storageBucket: "digitalgtp-6b713.firebasestorage.app",
  messagingSenderId: "535427350347",
  appId: "1:535427350347:web:662afecb0897327f7832ce"
};
const app = initializeApp(cfg);
const db = getFirestore(app);

async function fixDB() {
  console.log("Starting DB fix...");
  
  // 1. Retro-fill attendances for approved leaves
  console.log("Fetching leave_requests...");
  const leaveSnap = await getDocs(query(collection(db, 'leave_requests'), where('status', '==', 'Approved')));
  console.log(`Found ${leaveSnap.size} approved leaves`);
  
  let count = 0;
  for (const leaveDoc of leaveSnap.docs) {
    const data = leaveDoc.data();
    if (!data.employeeId || !data.date || !data.type) continue;
    
    const attId = `${data.employeeId}_${data.date}`;
    await setDoc(doc(db, 'attendances', attId), {
       employeeId: data.employeeId,
       date: data.date,
       status: data.type, // 'Izin' or 'Sakit'
       type: 'Leave',
       reason: data.reason || 'Sistem: Retroactive sync',
       timestamp: Date.now()
    }, { merge: true });
    count++;
  }
  console.log(`Synced ${count} leaves into attendances.`);

  // 2. Clean up company_info duplicates
  console.log("Fetching company_info...");
  const companySnap = await getDocs(query(collection(db, 'company_info'), where('key', '==', 'profile')));
  const docs = companySnap.docs;
  if (docs.length > 1) {
     docs.sort((a, b) => {
        const t1 = a.data().updatedAt || a.data().createdAt || 0;
        const t2 = b.data().updatedAt || b.data().createdAt || 0;
        return t2 - t1; // Descending
     });
     // keep the first one (most recent), delete the rest
     console.log(`Found ${docs.length} profile documents. Keeping id: ${docs[0].id}`);
     for(let i=1; i<docs.length; i++) {
        const idToDelete = docs[i].id;
        console.log("Deleting duplicated company_info: ", idToDelete);
        await deleteDoc(doc(db, 'company_info', idToDelete));
     }
  }
  console.log("DB fix complete.");
  process.exit(0);
}

fixDB().catch(e => {
  console.error("Error formatting DB:", e);
  process.exit(1);
});
