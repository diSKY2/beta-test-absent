import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";

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

async function check() {
  const companySnap = await getDocs(query(collection(db, 'company_info'), where('key', '==', 'profile')));
  console.log(`Found ${companySnap.size} profile docs.`);
  companySnap.forEach(doc => console.log(doc.id, "=>", doc.data()));
  process.exit(0);
}
check();
