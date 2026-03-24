import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { 
  Library, 
  Plus, 
  Star, 
  Users, 
  BookOpen, 
  Trash2, 
  Search, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  MessageSquare,
  ChevronRight
} from 'lucide-react';

// --- TU CONFIGURACIÓN REAL DE FIREBASE (Para que funcione en Vercel) ---
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
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroGenero, setFiltroGenero] = useState('Todos');
  const [enviando, setEnviando] = useState(false);
  const [notificacion, setNotificacion] = useState(null);

  const [nuevo, setNuevo] = useState({
    titulo: '',
    autor: '',
    genero: 'Ficción',
    puntuacion: 5,
    resena: ''
  });

  const notify = (texto, tipo = 'info') => {
    setNotificacion({ texto, tipo });
    setTimeout(() => setNotificacion(null), 4000);
  };

  // 1. Autenticación Inicial Anónima
  useEffect(() => {
    signInAnonymously(auth).catch(() => notify("Error de conexión con Firebase", "error"));
    return onAuthStateChanged(auth, setUser);
  }, []);

  // 2. Datos en tiempo real (Colección simple 'libros')
  useEffect(() => {
    if (!user) return;
    const ref = collection(db, 'libros');
    
    const unsub = onSnapshot(ref, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLibros(docs.sort((a, b) => b.fecha - a.fecha));
      setCargando(false);
    }, (err) => {
      console.error(err);
      setCargando(false);
    });
    return () => unsub();
  }, [user]);

  const guardar = async (e) => {
    e.preventDefault();
    if (!nuevo.titulo || !nuevo.autor) return notify("Título y autor requeridos", "error");
    if (!user) return notify("Esperando conexión...", "info");

    setEnviando(true);
    try {
      const ref = collection(db, 'libros');
      await addDoc(ref, {
        ...nuevo,
        usuario: `Amigo_${user.uid.substring(0, 3)}`,
        fecha: Date.now()
      });
      setNuevo({ titulo: '', autor: '', genero: 'Ficción', puntuacion: 5, resena: '' });
      notify("¡Libro recomendado!", "success");
    } catch (err) {
      notify("Error al guardar: " + err.message, "error");
    } finally {
      setEnviando(false);
    }
  };

  const borrar = async (id) => {
    if (confirm("¿Seguro que quieres borrar este libro?")) {
      try {
        await deleteDoc(doc(db, 'libros', id));
        notify("Libro eliminado");
      } catch (e) {
        notify("Error al eliminar", "error");
      }
    }
  };

  const filtrados = useMemo(() => {
    return libros.filter(l => {
      const texto = ((l.titulo || "") + (l.autor || "")).toLowerCase();
      const matchBusqueda = texto.includes(busqueda.toLowerCase());
      const matchGenero = filtroGenero === 'Todos' || l.genero === filtroGenero;
      return matchBusqueda && matchGenero;
    });
  }, [libros, busqueda, filtroGenero]);

  return (
    <div className="min-h-screen bg-[#FDFCF9] font-serif text-stone-900 pb-20">
      {/* Notificaciones Flotantes */}
      {notificacion && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 border transition-all animate-in fade-in slide-in-from-right-4 ${
          notificacion.tipo === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 
          notificacion.tipo === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 
          'bg-stone-800 text-white border-stone-700'
        }`}>
          {notificacion.tipo === 'error' ? <AlertCircle size={20} /> : 
           notificacion.tipo === 'success' ? <CheckCircle2 size={20} /> : <BookOpen size={20} />}
          <span className="font-sans text-xs font-bold uppercase tracking-tight">{notificacion.texto}</span>
        </div>
      )}

      {/* Navegación */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-stone-100 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-stone-900 p-2.5 rounded-2xl text-white shadow-xl rotate-3">
              <Library size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black italic text-stone-800 tracking-tight leading-none">Chichi Club</h1>
              <p className="text-[9px] font-sans font-black uppercase text-stone-400 tracking-[0.2em] mt-1">Biblioteca Compartida</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto font-sans">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={16} />
              <input 
                type="text" 
                placeholder="Buscar por título o autor..."
                className="w-full pl-11 pr-4 py-3 bg-stone-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-stone-100 transition-all border-none font-medium placeholder:text-stone-300 shadow-inner"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-10 mt-6">
        {/* Columna Izquierda: Formulario */}
        <div className="lg:col-span-4">
          <section className="bg-white p-8 rounded-[3rem] border border-stone-100 shadow-2xl shadow-stone-200/20 sticky top-28 overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
            
            <h2 className="text-xl font-bold mb-8 flex items-center gap-2 text-stone-800 relative">
              <Plus className="text-orange-800" size={20} /> Recomendar Lectura
            </h2>
            
            <form onSubmit={guardar} className="space-y-6 font-sans text-sm relative">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Título del libro</label>
                <input 
                  type="text" required
                  className="w-full bg-stone-50 p-4 rounded-2xl border border-transparent focus:bg-white focus:border-stone-100 outline-none transition-all font-medium"
                  value={nuevo.titulo}
                  onChange={e => setNuevo({...nuevo, titulo: e.target.value})}
                  placeholder="Ej: Los pilares de la tierra"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Autor / Escritor</label>
                <input 
                  type="text" required
                  className="w-full bg-stone-50 p-4 rounded-2xl border border-transparent focus:bg-white focus:border-stone-100 outline-none transition-all font-medium"
                  value={nuevo.autor}
                  onChange={e => setNuevo({...nuevo, autor: e.target.value})}
                  placeholder="Ken Follett"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Género</label>
                  <select 
                    className="w-full bg-stone-50 p-4 rounded-2xl border-none outline-none cursor-pointer font-bold text-stone-600 appearance-none shadow-sm"
                    value={nuevo.genero}
                    onChange={e => setNuevo({...nuevo, genero: e.target.value})}
                  >
                    <option>Ficción</option>
                    <option>Ensayo</option>
                    <option>Misterio</option>
                    <option>Fantasía</option>
                    <option>Poesía</option>
                  </select>
                </div>
                <div className="space-y-2 text-center">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Nota: {nuevo.puntuacion}⭐</label>
                  <input 
                    type="range" min="1" max="5" 
                    className="w-full accent-stone-900 mt-4 cursor-pointer"
                    value={nuevo.puntuacion}
                    onChange={e => setNuevo({...nuevo, puntuacion: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">¿Por qué leerlo?</label>
                <textarea 
                  className="w-full bg-stone-50 p-5 rounded-[2rem] h-40 focus:bg-white focus:border-stone-100 outline-none resize-none transition-all italic text-stone-600 font-medium leading-relaxed"
                  value={nuevo.resena}
                  onChange={e => setNuevo({...nuevo, resena: e.target.value})}
                  placeholder="Escribe tu breve opinión aquí..."
                />
              </div>

              <button 
                type="submit" 
                disabled={enviando}
                className="w-full bg-stone-900 text-white font-black py-5 rounded-[2rem] hover:bg-black active:scale-[0.98] transition-all shadow-2xl shadow-stone-300 flex items-center justify-center gap-3 uppercase tracking-widest text-[10px]"
              >
                {enviando ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                {enviando ? 'Guardando...' : 'Añadir a la Estantería'}
              </button>
            </form>
          </section>
        </div>

        {/* Columna Derecha: Estantería */}
        <div className="lg:col-span-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
            <h2 className="text-4xl font-black text-stone-800 tracking-tight flex items-center gap-4">
              <BookOpen className="text-stone-800" size={36} /> 
              <span>Estantería <span className="text-stone-300 font-normal italic">viva</span></span>
            </h2>
            <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-3 sm:pb-0 font-sans no-scrollbar">
              {['Todos', 'Ficción', 'Ensayo', 'Misterio', 'Fantasía'].map(g => (
                <button 
                  key={g}
                  onClick={() => setFiltroGenero(g)}
                  className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${filtroGenero === g ? 'bg-stone-900 text-white border-stone-900 shadow-xl' : 'bg-white text-stone-300 border-stone-100 hover:text-stone-500 hover:border-stone-200'}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {cargando ? (
            <div className="flex flex-col items-center justify-center py-40 text-stone-300">
              <Loader2 className="animate-spin mb-6" size={48} strokeWidth={1} />
              <p className="italic font-medium">Desempolvando los libros...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filtrados.map(l => (
                <article 
                  key={l.id} 
                  className="bg-white p-8 rounded-[3.5rem] border border-stone-50 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-700 group relative flex flex-col h-full overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-stone-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700 opacity-20"></div>
                  
                  <button 
                    onClick={() => borrar(l.id)}
                    className="absolute top-8 right-8 text-stone-100 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2 z-10"
                  >
                    <Trash2 size={20} />
                  </button>

                  <div className="flex justify-between items-start mb-8 font-sans z-10">
                    <span className="bg-stone-900 text-white text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg">
                      {l.genero}
                    </span>
                    <div className="flex gap-0.5 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} fill={i < l.puntuacion ? "currentColor" : "none"} className={i < l.puntuacion ? "" : "text-stone-100"} />
                      ))}
                    </div>
                  </div>

                  <div className="mb-6 z-10">
                    <h3 className="text-2xl font-black text-stone-900 leading-[1.1] mb-2">{l.titulo}</h3>
                    <div className="flex items-center gap-2 text-stone-400 italic text-sm">
                      <ChevronRight size={14} className="text-orange-800" />
                      <span>{l.autor}</span>
                    </div>
                  </div>
                  
                  {l.resena && (
                    <div className="bg-stone-50/70 p-7 rounded-[2.5rem] mb-10 flex-1 relative border-l-2 border-stone-100">
                      <MessageSquare className="absolute -top-3 -right-3 text-stone-200 opacity-50" size={40} />
                      <p className="text-stone-600 text-sm italic leading-relaxed line-clamp-5 relative z-10">
                        "{l.resena}"
                      </p>
                    </div>
                  )}

                  <div className="mt-auto pt-6 border-t border-stone-50 flex justify-between items-center text-[9px] text-stone-300 font-bold uppercase tracking-[0.15em] font-sans">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-stone-900 text-white flex items-center justify-center text-[9px] font-black shadow-lg">
                        {l.usuario?.charAt(6) || "L"}
                      </div>
                      <span className="text-stone-400">{l.usuario}</span>
                    </div>
                    <span className="bg-stone-50 px-3 py-1 rounded-full">{new Date(l.fecha).toLocaleDateString()}</span>
                  </div>
                </article>
              ))}

              {filtrados.length === 0 && (
                <div className="col-span-full py-40 text-center border-2 border-dashed border-stone-100 rounded-[4rem] bg-stone-50/30">
                  <Library className="mx-auto text-stone-100 mb-8 scale-150 opacity-20" size={64} />
                  <p className="text-stone-300 italic text-xl">Silencio en la sala...</p>
                  <p className="text-stone-200 font-sans font-bold text-[10px] mt-4 uppercase tracking-[0.3em]">No hay lecturas disponibles</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
