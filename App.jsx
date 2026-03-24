import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot } from 'firebase/firestore';
import { Library, Plus, Star, MessageSquare, Users, BookOpen } from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE ---
// IMPORTANTE: Sustituye estos valores por los de tu propio proyecto en Firebase Console
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_ID",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [user, setUser] = useState(null);
  const [libros, setLibros] = useState([]);
  const [nuevo, setNuevo] = useState({ titulo: '', autor: '', genero: 'Ficción', puntuacion: 5, resena: '' });

  useEffect(() => {
    signInAnonymously(auth);
    onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const ref = collection(db, 'libros_club');
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLibros(data.sort((a, b) => b.fecha - a.fecha));
    });
    return () => unsub();
  }, [user]);

  const guardar = async (e) => {
    e.preventDefault();
    if (!nuevo.titulo || !nuevo.autor) return;
    await addDoc(collection(db, 'libros_club'), {
      ...nuevo,
      usuario: `Amigo_${user.uid.substring(0, 3)}`,
      fecha: Date.now()
    });
    setNuevo({ titulo: '', autor: '', genero: 'Ficción', puntuacion: 5, resena: '' });
  };

  return (
    <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8 font-serif">
      <header className="max-w-5xl mx-auto flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-orange-100 mb-8">
        <div className="flex items-center gap-3">
          <BookOpen className="text-orange-800" size={32} />
          <h1 className="text-2xl font-bold text-stone-800">Nuestro Club de Lectura</h1>
        </div>
        <div className="bg-orange-50 text-orange-800 px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2">
          <Users size={16} /> {libros.length} Libros
        </div>
      </header>

      <main className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <aside>
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-stone-100 sticky top-10">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus size={18}/> Nueva Recomendación</h2>
            <form onSubmit={guardar} className="space-y-4 font-sans text-sm">
              <input type="text" placeholder="Título" className="w-full p-3 bg-stone-50 rounded-xl outline-none" 
                value={nuevo.titulo} onChange={e => setNuevo({...nuevo, titulo: e.target.value})} />
              <input type="text" placeholder="Autor" className="w-full p-3 bg-stone-50 rounded-xl outline-none" 
                value={nuevo.autor} onChange={e => setNuevo({...nuevo, autor: e.target.value})} />
              <select className="w-full p-3 bg-stone-50 rounded-xl outline-none" 
                value={nuevo.genero} onChange={e => setNuevo({...nuevo, genero: e.target.value})}>
                <option>Ficción</option><option>Ensayo</option><option>Fantasía</option><option>Otro</option>
              </select>
              <div className="flex justify-between items-center text-xs font-bold text-stone-400">
                <span>NOTA: {nuevo.puntuacion} ⭐</span>
                <input type="range" min="1" max="5" value={nuevo.puntuacion} className="accent-orange-800"
                  onChange={e => setNuevo({...nuevo, puntuacion: parseInt(e.target.value)})} />
              </div>
              <textarea placeholder="¿Por qué lo recomiendas?" className="w-full p-3 bg-stone-50 rounded-xl h-24 outline-none resize-none"
                value={nuevo.resena} onChange={e => setNuevo({...nuevo, resena: e.target.value})} />
              <button className="w-full bg-stone-800 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-md">
                Publicar para el grupo
              </button>
            </form>
          </div>
        </aside>

        <div className="lg:col-span-2 space-y-4">
          {libros.map(l => (
            <div key={l.id} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">{l.genero}</span>
                  <h3 className="text-xl font-bold text-stone-800">{l.titulo}</h3>
                  <p className="text-stone-500 italic">de {l.autor}</p>
                </div>
                <div className="flex text-amber-400">
                  {[...Array(l.puntuacion)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                </div>
              </div>
              {l.resena && <p className="mt-4 text-stone-700 bg-stone-50 p-4 rounded-2xl text-sm italic border-l-4 border-orange-200">"{l.resena}"</p>}
              <div className="mt-4 pt-4 border-t border-stone-50 flex justify-between text-[10px] text-stone-300 font-bold uppercase">
                <span>Añadido por {l.usuario}</span>
                <span>{new Date(l.fecha).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
