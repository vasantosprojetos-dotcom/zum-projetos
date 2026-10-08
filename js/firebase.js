// Camada fina sobre o Firebase. O resto do app só conversa com estas funções,
// o que permite trocar ou atualizar o Firebase sem mexer nas telas.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut,
  sendPasswordResetEmail, setPersistence, browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, onSnapshot, setDoc, deleteDoc, getDocs, getDoc, writeBatch
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(() => {});

// Cache local: o app abre rápido e funciona sem internet, sincronizando depois.
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

let uid = null;
const raiz = () => `usuarios/${uid}`;

export function aoMudarUsuario(cb) {
  return onAuthStateChanged(auth, (u) => {
    uid = u ? u.uid : null;
    cb(u ? { uid: u.uid, email: u.email } : null);
  });
}
export const entrar = (email, senha) => signInWithEmailAndPassword(auth, email, senha);
export const sair = () => signOut(auth);
export const redefinirSenha = (email) => sendPasswordResetEmail(auth, email);

export function novoId(col) {
  return doc(collection(db, `${raiz()}/${col}`)).id;
}

export function ouvir(col, cb, aoErro) {
  return onSnapshot(collection(db, `${raiz()}/${col}`), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, aoErro);
}

export function salvar(col, id, dados) {
  return setDoc(doc(db, `${raiz()}/${col}/${id}`), dados, { merge: true });
}

export function substituir(col, id, dados) {
  return setDoc(doc(db, `${raiz()}/${col}/${id}`), dados);
}

export function remover(col, id) {
  return deleteDoc(doc(db, `${raiz()}/${col}/${id}`));
}

export async function ler(col) {
  const snap = await getDocs(collection(db, `${raiz()}/${col}`));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function lerUm(col, id) {
  const s = await getDoc(doc(db, `${raiz()}/${col}/${id}`));
  return s.exists() ? { id: s.id, ...s.data() } : null;
}

// Grava muitas operações em pacotes de até 400 (limite do Firestore é 500).
// ops: [{ tipo: "set" | "delete", col, id, dados }]
export async function emLote(ops) {
  for (let i = 0; i < ops.length; i += 400) {
    const b = writeBatch(db);
    for (const op of ops.slice(i, i + 400)) {
      const ref = doc(db, `${raiz()}/${op.col}/${op.id}`);
      if (op.tipo === "delete") b.delete(ref);
      else b.set(ref, op.dados);
    }
    await b.commit();
  }
}
