import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, setDoc, doc } from "firebase/firestore";

const cfg = {
  projectId: "striking-yolk-zg02f",
  appId: "1:400327702315:web:f320698075c9fd1cdf776e",
  apiKey: "AIzaSyCVUoyosMgT4J7HSCiUwUoJfW9FtQ2uOyA",
  authDomain: "striking-yolk-zg02f.firebaseapp.com",
  storageBucket: "striking-yolk-zg02f.firebasestorage.app",
  messagingSenderId: "400327702315"
};
const app = initializeApp(cfg);
const db = getFirestore(app, "ai-studio-77c53dd2-ef2c-45b2-81fb-7589e960e386");

async function seed() {
  await setDoc(doc(collection(db, 'company_info'), 'profile_default'), {
    key: 'profile',
    name: 'PT. GARUDA TRISULA PERKASA',
    tagline: 'INTEGRITAS • TANGGUH • PROFESIONAL • DISIPLIN',
    phone: '+62 811-1234-5678',
    email: 'admin@garudatrisula.com',
    website: 'www.garudatrisula.com',
    address: 'Jl. Jendral Sudirman Kav. 21, Jakarta Pusat, DKI Jakarta',
    content: 'PT. GARUDA TRISULA PERKASA was established as a company focused on professional security (PAM Suwakarsa).',
    logoUrl: ''
  });
  console.log("Seeded default company_info");
  process.exit(0);
}
seed();
