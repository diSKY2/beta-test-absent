import { initializeApp as realInitializeApp } from "firebase/app";
import { getFirestore as realGetFirestore, collection as realFbCollection, doc as realFbDoc, setDoc as realFbSetDoc, addDoc as realFbAddDoc, updateDoc as realFbUpdateDoc, deleteDoc as realFbDeleteDoc, writeBatch as realFbWriteBatch, getDocs as realFbGetDocs } from "firebase/firestore";
import firebaseConfigData from '../../firebase-applet-config.json';

const realApp = realInitializeApp(firebaseConfigData);
const realDb = realGetFirestore(realApp, firebaseConfigData.firestoreDatabaseId || "(default)");

export const getFirestore = (...args: any[]) => ({});
export const getStorage = (...args: any[]) => ({});
export const db = {};
export const storage = {};
export const getAuth = (...args: any[]) => ({});
export const signInWithEmailAndPassword = async (...args: any[]) => ({});
export const createUserWithEmailAndPassword = async (...args: any[]) => ({});
export const signInWithPopup = async (...args: any[]) => ({});
export const GoogleAuthProvider = class {};
export const signInAnonymously = async (...args: any[]) => ({});
export const uploadBytesResumable = (...args: any[]) => ({ on: (event: any, a: any, b: any, c: any) => c() });
export const ref = (...args: any[]) => ({});
export const getDownloadURL = async (...args: any[]) => ('/profile.jpg');
export const initializeApp = (...args: any[]) => ({});
export const firebaseConfig = {};

// Firebase Auth mock matching the required interfaces
const defaultUser = JSON.parse(localStorage.getItem('appSession') || '{}')?.user || null;

export const auth = {
  currentUser: defaultUser,
  onAuthStateChanged: (cb: any) => { cb(defaultUser); return () => {}; },
};

export const serverTimestamp = () => new Date();

export function collection(db: any, name: string) {
  return { type: 'collection', name };
}

export function doc(db: any, name: string, id: string) {
  return { type: 'doc', name, id };
}

export function query(col: any, ...args: any[]) {
  return { ...col, queries: args.filter((a: any) => a.type === 'where'), orders: args.filter((a: any) => a.type === 'orderBy') };
}

export function where(field: string, op: string, val: any) {
  return { type: 'where', field, op, val };
}

export function orderBy(field: string, dir: string = 'asc') {
  return { type: 'orderBy', field, dir };
}

export async function getDocs(queryObj: any) {
  // Use real Firebase for collections that the Android app writes directly to
  if (queryObj.name === 'work_reports' || queryObj.name === 'attendances') {
    // For simplicity, we just fetch from the collection without applying Queries since the Admin UI just sorts/filters client-side now or we can implement real query mappings later.
    // However, the original code had `queries: []` which is fine.
    const realCol = realFbCollection(realDb, queryObj.name);
    const snap = await realFbGetDocs(realCol);
    return {
      empty: snap.empty,
      docs: snap.docs.map((d: any) => ({
        id: d.id,
        data: () => d.data()
      })),
      forEach(callback: (doc: any) => void) {
        this.docs.forEach(callback);
      }
    };
  }

  const reqBody = {
    action: 'getDocs',
    collection: queryObj.name,
    queries: queryObj.queries || [],
    order: queryObj.orders || []
  };
  const res = await fetch('/api/sql/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqBody)
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return {
    empty: data.length === 0,
    docs: data.map((d: any) => ({
      id: d.id,
      data: () => d
    })),
    forEach(callback: (doc: any) => void) {
      this.docs.forEach(callback);
    }
  };
}

export async function addDoc(col: any, data: any) {
  const res = await fetch('/api/sql/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'addDoc', collection: col.name, data })
  });
  if (!res.ok) throw new Error(await res.text());
  
  const parsedResponse = await res.json();
  const idFromPg = parsedResponse.id;
  
  // Dual write to real Firebase so mobile app stays synced
  try {
    const realRef = realFbDoc(realDb, col.name, idFromPg);
    await realFbSetDoc(realRef, data);
  } catch (e) { console.error("Firebase sync error on addDoc", e); }
  
  return parsedResponse;
}

export async function batchSetDocs(collectionName: string, docs: { id: string, data: any }[]) {
  const res = await fetch('/api/sql/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'batchSetDocs', collection: collectionName, docs })
  });
  if (!res.ok) throw new Error(await res.text());
  
  const parsedResponse = await res.json();
  
  try {
    const batch = realFbWriteBatch(realDb);
    docs.forEach(d => {
      const realRef = realFbDoc(realDb, collectionName, d.id);
      batch.set(realRef, d.data, { merge: true });
    });
    await batch.commit();
  } catch (e) { console.error("Firebase sync error on batchSetDocs", e); }
  
  return parsedResponse;
}
export async function setDoc(docObj: any, data: any, options?: any) {
  const res = await fetch('/api/sql/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'setDoc', collection: docObj.name, docId: docObj.id, data, options })
  });
  if (!res.ok) throw new Error(await res.text());
  
  const parsedResponse = await res.json();
  
  try {
    const realRef = realFbDoc(realDb, docObj.name, docObj.id);
    await realFbSetDoc(realRef, data, options || {});
  } catch (e) { console.error("Firebase sync error on setDoc", e); }
  
  return parsedResponse;
}

export async function updateDoc(docObj: any, data: any) {
  const res = await fetch('/api/sql/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'updateDoc', collection: docObj.name, docId: docObj.id, data })
  });
  if (!res.ok) throw new Error(await res.text());
  
  const parsedResponse = await res.json();
  
  try {
    const realRef = realFbDoc(realDb, docObj.name, docObj.id);
    await realFbUpdateDoc(realRef, data);
  } catch (e) { console.error("Firebase sync error on updateDoc", e); }
  
  return parsedResponse;
}

export async function deleteDoc(docObj: any) {
  const res = await fetch('/api/sql/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'deleteDoc', collection: docObj.name, docId: docObj.id })
  });
  if (!res.ok) throw new Error(await res.text());
  
  const parsedResponse = await res.json();
  
  try {
    const realRef = realFbDoc(realDb, docObj.name, docObj.id);
    await realFbDeleteDoc(realRef);
  } catch (e) { console.error("Firebase sync error on deleteDoc", e); }
  
  return parsedResponse;
}

export function onSnapshot(queryObj: any, onNext: (snap: any) => void, onError?: (err: any) => void) {
  let isCancelled = false;
  
  const fetchCycle = () => {
    if (isCancelled) return;
    getDocs(queryObj).then(snap => {
      if (!isCancelled) onNext(snap);
      setTimeout(fetchCycle, 5000);
    }).catch(err => {
      if (onError && !isCancelled) onError(err);
      setTimeout(fetchCycle, 5000);
    });
  };
  
  fetchCycle();
  
  return () => { isCancelled = true; };
}
