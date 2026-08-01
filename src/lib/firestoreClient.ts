
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";




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

let batchQueue: any[] = [];
let batchTimeout: any = null;

async function processBatchQueue() {
  const currentBatch = batchQueue;
  batchQueue = [];
  batchTimeout = null;
  
  if (currentBatch.length === 0) return;
  
  const reqBody = {
    action: 'batchGetDocs',
    batch: currentBatch.map(b => ({
      collection: b.queryObj.name,
      queries: b.queryObj.queries || [],
      order: b.queryObj.orders || []
    }))
  };

  try {
    const res = await fetch(API_BASE_URL + '/api/sql/rpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody)
    });
    
    if (!res.ok) throw new Error(await res.text());
    const batchResults = await res.json();
    
    batchResults.forEach((data: any, index: number) => {
      const b = currentBatch[index];
      b.resolve({
        empty: data.length === 0,
        docs: data.map((d: any) => ({
          id: d.id,
          data: () => d
        })),
        forEach(callback: (doc: any) => void) {
          this.docs.forEach(callback);
        }
      });
    });
  } catch (err) {
    currentBatch.forEach(b => b.reject(err));
  }
}

export async function getDocs(queryObj: any): Promise<{ empty: boolean, docs: any[], forEach: (cb: (doc: any) => void) => void }> {
  return new Promise((resolve, reject) => {
    batchQueue.push({ queryObj, resolve, reject });
    if (!batchTimeout) {
      batchTimeout = setTimeout(processBatchQueue, 20);
    }
  });
}

export async function addDoc(col: any, data: any) {
  const res = await fetch(API_BASE_URL + '/api/sql/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'addDoc', collection: col.name, data })
  });
  if (!res.ok) throw new Error(await res.text());
  
  const parsedResponse = await res.json();
  const idFromPg = parsedResponse.id;
  
  return parsedResponse;
}

export async function batchSetDocs(collectionName: string, docs: { id: string, data: any }[]) {
  const res = await fetch(API_BASE_URL + '/api/sql/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'batchSetDocs', collection: collectionName, docs })
  });
  if (!res.ok) throw new Error(await res.text());
  
  const parsedResponse = await res.json();
  
  return parsedResponse;
}
export async function setDoc(docObj: any, data: any, options?: any) {
  const res = await fetch(API_BASE_URL + '/api/sql/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'setDoc', collection: docObj.name, docId: docObj.id, data, options })
  });
  if (!res.ok) throw new Error(await res.text());
  
  const parsedResponse = await res.json();
  
  return parsedResponse;
}

export async function updateDoc(docObj: any, data: any) {
  const res = await fetch(API_BASE_URL + '/api/sql/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'updateDoc', collection: docObj.name, docId: docObj.id, data })
  });
  if (!res.ok) throw new Error(await res.text());
  
  const parsedResponse = await res.json();
  
  return parsedResponse;
}

export async function deleteDoc(docObj: any) {
  const res = await fetch(API_BASE_URL + '/api/sql/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'deleteDoc', collection: docObj.name, docId: docObj.id })
  });
  if (!res.ok) throw new Error(await res.text());
  
  const parsedResponse = await res.json();
  
  return parsedResponse;
}

export function onSnapshot(queryObj: any, onNext: (snap: any) => void, onError?: (err: any) => void) {
  let isCancelled = false;
  
  const fetchCycle = () => {
    if (isCancelled) return;
    getDocs(queryObj).then(snap => {
      if (!isCancelled) onNext(snap);
      setTimeout(fetchCycle, 30000);
    }).catch(err => {
      if (onError && !isCancelled) onError(err);
      setTimeout(fetchCycle, 30000);
    });
  };
  
  fetchCycle();
  
  return () => { isCancelled = true; };
}

export async function getDoc(docRef: any) {
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
