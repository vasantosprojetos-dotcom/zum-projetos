// Camada fina sobre o Firebase. O resto do app só conversa com estas funções,
// o que permite trocar ou atualizar o Firebase sem mexer nas telas.
// Desde a versão 2, os dados ficam numa pasta comum da Zum (coleções na raiz do banco),
// e as regras de segurança decidem o que cada pessoa pode ver.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut,
  sendPasswordResetEmail, setPersistence, browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, onSnapshot, setDoc, deleteDoc, getDocs, getDoc, writeBatch,
  query, where, addDoc, getDocsFromServer, getDocFromServer
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(() => {});

// Cache local: o app abre rápido e funciona sem internet, sincronizando depois.
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

// A administradora do app (Vanessa). O mesmo ID está nas regras de segurança.
export const UID_ADMIN = "FoT9nkm7XlZp3g2HZAsYkXd9dR32";

let uid = null;

export function aoMudarUsuario(cb) {
  return onAuthStateChanged(auth, (u) => {
    uid = u ? u.uid : null;
    cb(u ? { uid: u.uid, email: (u.email || "").toLowerCase() } : null);
  });
}
export const entrar = (email, senha) => signInWithEmailAndPassword(auth, email, senha);
export const sair = () => signOut(auth);
export const redefinirSenha = (email) => sendPasswordResetEmail(auth, email);

export function novoId(col) {
  return doc(collection(db, col)).id;
}

const lista = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

// Ouve uma coleção inteira (só a administradora pode).
export function ouvir(col, cb, aoErro) {
  return onSnapshot(collection(db, col), (snap) => cb(lista(snap)), aoErro);
}

// Ouve os documentos de uma coleção em que campo == valor.
export function ouvirOnde(col, campo, valor, cb, aoErro) {
  return onSnapshot(query(collection(db, col), where(campo, "==", valor)), (snap) => cb(lista(snap)), aoErro);
}

// Ouve um documento só (null se não existir).
export function ouvirDoc(col, id, cb, aoErro) {
  return onSnapshot(doc(db, col, id), (s) => cb(s.exists() ? { id: s.id, ...s.data() } : null), aoErro);
}

export function salvar(col, id, dados) {
  return setDoc(doc(db, col, id), dados, { merge: true });
}

export function substituir(col, id, dados) {
  return setDoc(doc(db, col, id), dados);
}

export function remover(col, id) {
  return deleteDoc(doc(db, col, id));
}

export async function ler(col) {
  return lista(await getDocs(collection(db, col)));
}

export async function lerUm(col, id) {
  const s = await getDoc(doc(db, col, id));
  return s.exists() ? { id: s.id, ...s.data() } : null;
}

// Leituras direto do servidor (sem usar a cópia local). Falham se não houver conexão.
export async function lerOndeServidor(col, campo, valor) {
  return lista(await getDocsFromServer(query(collection(db, col), where(campo, "==", valor))));
}
export async function lerUmServidor(col, id) {
  const s = await getDocFromServer(doc(db, col, id));
  return s.exists() ? { id: s.id, ...s.data() } : null;
}

// Registros (comentários e histórico) de uma tarefa
export function ouvirRegistros(tarefaId, cb, aoErro) {
  return onSnapshot(collection(db, "tarefas", tarefaId, "registros"), (snap) => cb(lista(snap)), aoErro);
}
export function registrar(tarefaId, dados) {
  return addDoc(collection(db, "tarefas", tarefaId, "registros"), dados);
}

// Pasta antiga, de antes da equipe (usuarios/<uid>/...). Só para a migração.
export async function lerAntigo(col) {
  return lista(await getDocs(collection(db, "usuarios", uid, col)));
}
export async function lerUmAntigo(col, id) {
  const s = await getDoc(doc(db, "usuarios", uid, col, id));
  return s.exists() ? { id: s.id, ...s.data() } : null;
}

// Grava muitas operações em pacotes de até 400 (limite do Firestore é 500).
// ops: [{ tipo: "set" | "merge" | "delete", col, id, dados }]
export async function emLote(ops) {
  for (let i = 0; i < ops.length; i += 400) {
    const b = writeBatch(db);
    for (const op of ops.slice(i, i + 400)) {
      const ref = doc(db, op.col, op.id);
      if (op.tipo === "delete") b.delete(ref);
      else if (op.tipo === "merge") b.set(ref, op.dados, { merge: true });
      else b.set(ref, op.dados);
    }
    await b.commit();
  }
}
