import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Library, Plus, Star, MessageSquare, Users, BookOpen, Trash2, Search, Filter } from 'lucide-react';

// --- TU CONFIGURACIÓN REAL DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyBAvZtxfga0eN7y6I3ooAGHkQ-fYbl1zvi",
  authDomain: "chichi-club.firebaseapp.com",
  projectId: "chichi-club",
  storageBucket: "chichi-club.firebasestorage.app",
  messagingSenderId: "258549599311",
  appId: "1:258549599311:web:f176a7e7746fb6773f6c3a",
  measurementId: "G-9REPSYELMH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [user, setUser] = useState(null);
  const [libros, setLibros] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroGenero, setFiltroGenero] = useState('Todos');
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
      usuarioId: user.uid,
      usuario: `Amigo_${user.uid.substring(0, 3)}`,
      fecha: Date.now()
    });
    setNuevo({ titulo: '', autor: '', genero: 'Ficción', puntuacion: 5, resena: '' });
  };

  const eliminarLibro = async (id) => {
    if (window.confirm("¿Seguro que quieres borrar esta recomendación?")) {
      await deleteDoc(doc(db, 'libros_club', id));
    }
  };

  // Lógica de filtrado
  const librosFiltrados = useMemo(() => {
    return libros.filter(l => {
      const coincidenTexto = l.titulo.toLowerCase().includes(busqueda.toLowerCase()) || 
                             l.autor.toLowerCase().includes(busqueda.toLowerCase());
      const coincideGenero = filtroGenero === 'Todos' || l.genero === filtroGenero;
      return coincidenTexto && coincideGenero;
    });
  }, [libros, busqueda, filtroGenero]);

  return (
    <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8 font-serif text-stone-900">
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-orange-100 mb-8 gap-4">
        <div className="flex items-center gap-3">
          <BookOpen className="text-orange-800" size={32} />
          <h1 className="text-2xl font-bold text-stone-800 italic">Nuestro Club de Lectura</h1>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por título o autor..."
              className="w-full pl-10 pr-4 py-2 bg-stone-50 rounded-full text-sm outline-none focus:ring-1 focus:ring-orange-200"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="bg-orange-50 text-orange-800 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 whitespace-nowrap">
            <Users size={14} /> {libros.length} Libros
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Panel Izquierdo: Formulario */}
        <aside className="lg:col-span-1">
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-stone-100 sticky top-10">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus size={18}/> Recomendar</h2>
            <form onSubmit={guardar} className="space-y-4 font-sans text-sm">
              <input type="text" placeholder="Título" className="w-full p-3 bg-stone-50 rounded-xl outline-none" 
                value={nuevo.titulo} onChange={e => setNuevo({...nuevo, titulo: e.target.value})} />
              <input type="text" placeholder="Autor" className="w-full p-3 bg-stone-50 rounded-xl outline-none" 
                value={nuevo.autor} onChange={e => setNuevo({...nuevo, autor: e.target.value})} />
              <select className="w-full p-3 bg-stone-50 rounded-xl outline-none" 
                value={nuevo.genero} onChange={e => setNuevo({...nuevo, genero: e.target.value})}>
                <option>Ficción</option><option>Ensayo</option><option>Fantasía</option><option>Misterio</option><option>Otro</option>
              </select>
              <div className="flex justify-between items-center text-xs font-bold text-stone-400">
                <span>VALORACIÓN: {nuevo.puntuacion} ⭐</span>
                <input type="range" min="1" max="5" value={nuevo.puntuacion} className="accent-orange-800"
                  onChange={e => setNuevo({...nuevo, puntuacion: parseInt(e.target.value)})} />
              </div>
              <textarea placeholder="¿Qué te ha parecido?" className="w-full p-3 bg-stone-50 rounded-xl h-24 outline-none resize-none"
                value={nuevo.resena} onChange={e => setNuevo({...nuevo, resena: e.target.value})} />
              <button className="w-full bg-stone-800 text-white py-4 rounded-2xl font-bold hover:bg-stone-900 transition-all shadow-md">
                Publicar Ahora
              </button>
            </form>
          </div>
        </aside>

        {/* Panel Derecho: Lista */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {['Todos', 'Ficción', 'Ensayo', 'Fantasía', 'Misterio'].map(g => (
              <button 
                key={g}
                onClick={() => setFiltroGenero(g)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${filtroGenero === g ? 'bg-orange-800 text-white shadow-md' : 'bg-white text-stone-400 border border-stone-100'}`}
              >
                {g}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {librosFiltrados.map(l => (
              <div key={l.id} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all relative group">
                <button 
                  onClick={() => eliminarLibro(l.id)}
                  className="absolute top-4 right-4 text-stone-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>

                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded">{l.genero}</span>
                  <div className="flex text-amber-400">
                    {[...Array(l.puntuacion)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-stone-800 leading-tight">{l.titulo}</h3>
                <p className="text-stone-500 italic text-sm">de {l.autor}</p>
                
                {l.resena && (
                  <div className="mt-4 text-stone-700 bg-stone-50/50 p-4 rounded-2xl text-sm italic border-l-2 border-orange-100">
                    "{l.resena}"
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-stone-50 flex justify-between text-[10px] text-stone-300 font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Users size={10}/> {l.usuario}</span>
                  <span>{new Date(l.fecha).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>

          {librosFiltrados.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-stone-100">
              <p className="text-stone-300 italic">No se han encontrado lecturas...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
