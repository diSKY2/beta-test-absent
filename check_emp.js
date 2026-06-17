import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const cfg = {
  apiKey: "AIzaSyCYZ57fun9z9h_1sl9IUrVxQCpGKjSlysU",
  authDomain: "digitalgtp-6b713.firebaseapp.com",
  projectId: "digitalgtp-6b713",
  storageBucket: "digitalgtp-6b713.firebasestorage.app"
};
const app = initializeApp(cfg);
const db = getFirestore(app);

async function check() {
  const empSnap = await getDocs(collection(db, 'employees'));
  empSnap.forEach(doc => console.log(doc.id, "=> profilePicUrl:", doc.data().profilePicUrl));
  process.exit(0);
}
check();
