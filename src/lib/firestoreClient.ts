export const db = {};
export const storage = {};
export const getAuth = () => ({});
export const signInWithEmailAndPassword = async () => ({});
export const createUserWithEmailAndPassword = async () => ({});
export const signInWithPopup = async () => ({});
export const GoogleAuthProvider = class {};
export const signInAnonymously = async () => ({});
export const uploadBytesResumable = () => ({ on: (event: any, a: any, b: any, c: any) => c() });
export const ref = () => ({});
export const getDownloadURL = async () => ('/profile.jpg');
export const initializeApp = () => ({});
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
  return await res.json();
}

export async function setDoc(docObj: any, data: any) {
  const res = await fetch('/api/sql/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'setDoc', collection: docObj.name, docId: docObj.id, data })
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function updateDoc(docObj: any, data: any) {
  const res = await fetch('/api/sql/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'updateDoc', collection: docObj.name, docId: docObj.id, data })
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function deleteDoc(docObj: any) {
  const res = await fetch('/api/sql/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'deleteDoc', collection: docObj.name, docId: docObj.id })
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
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
