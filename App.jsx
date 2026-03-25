import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { 
  Library, Plus, Star, Users, BookOpen, Trash2, Search, Loader2, AlertCircle, CheckCircle2, MessageSquare, ChevronRight, Quote
} from 'lucide-react';

// --- CONFIGURACIÓN DE ENTORNO (Para el Canvas) ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'chichi-club-v3';

export default function App() {
  const [user, setUser] = useState(null);
  const [libros, setLibros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [notificacion, setNotificacion] = useState(null);

  const [nuevo, setNuevo] = useState({
    titulo: '', autor: '', genero: 'Ficción', puntuacion: 5, resena: ''
  });

  const notify = (texto, tipo = 'info') => {
    setNotificacion({ texto, tipo });
    setTimeout(() => setNotificacion(null), 5000);
  };

  // 1. AUTENTICACIÓN (REGLA 3: Auth siempre primero)
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        notify("Error de conexión", "error");
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  // 2. DATOS (REGLA 1: Rutas estrictas /artifacts/...)
  useEffect(() => {
    if (!user) return;
    
    // Ruta obligatoria para evitar errores de permisos
    const ref = collection(db, 'artifacts', appId, 'public', 'data', 'libros');
    
    const unsub = onSnapshot(ref, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // REGLA 2: Ordenar en memoria, no en la query
      setLibros(docs.sort((a, b) => (b.fecha || 0) - (a.fecha || 0)));
      setCargando(false);
    }, (err) => {
      notify("Error al leer la base de datos", "error");
      setCargando(false);
    });
    
    return () => unsub();
  }, [user]);

  const guardar = async (e) => {
    e.preventDefault();
    if (!nuevo.titulo || !nuevo.autor) return notify("Título y autor requeridos", "error");
    if (!user) return notify("Conectando...", "info");

    setEnviando(true);
    try {
      const ref = collection(db, 'artifacts', appId, 'public', 'data', 'libros');
      await addDoc(ref, {
        ...nuevo,
        usuario: `Amigo_${user.uid.substring(0, 3)}`,
        fecha: Date.now()
      });
      setNuevo({ titulo: '', autor: '', genero: 'Ficción', puntuacion: 5, resena: '' });
      notify("¡Libro recomendado!", "success");
    } catch (err) {
      notify("No se pudo guardar: " + err.message, "error");
    } finally {
      setEnviando(false);
    }
  };

  const borrar = async (id) => {
    if (confirm("¿Borrar este libro?")) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'libros', id));
        notify("Eliminado");
      } catch (e) {
        notify("Error al borrar", "error");
      }
    }
  };

  const filtrados = useMemo(() => {
    return libros.filter(l => 
      ((l.titulo || "") + (l.autor || "")).toLowerCase().includes(busqueda.toLowerCase())
    );
  }, [libros, busqueda]);

  return (
    <div className="min-h-screen bg-[#FDFCF9] font-serif text-stone-900 pb-20">
      {/* Alerta flotante */}
      {notificacion && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 border animate-in fade-in slide-in-from-top-4 ${
          notificacion.tipo === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 
          notificacion.tipo === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 
          'bg-stone-800 text-white border-stone-700'
        }`}>
          {notificacion.tipo === 'error' ? <AlertCircle size={20} /> : 
           notificacion.tipo === 'success' ? <CheckCircle2 size={20} /> : <BookOpen size={20} />}
          <span className="font-sans text-xs font-bold uppercase tracking-tight">{notificacion.texto}</span>
        </div>
      )}

      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-stone-100 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-stone-900 p-2.5 rounded-2xl text-white shadow-xl rotate-3">
              <Library size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black italic text-stone-800 tracking-tight leading-none">Chichi Club</h1>
              <p className="text-[9px] font-sans font-black uppercase text-stone-400 tracking-[0.2em] mt-1 text-center">Biblioteca Viva</p>
            </div>
          </div>
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por libro o autor..."
              className="w-full pl-11 pr-4 py-3 bg-stone-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-stone-100 border-none font-medium placeholder:text-stone-300 shadow-inner font-sans"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-10 mt-6">
        {/* Formulario */}
        <div className="lg:col-span-4">
          <section className="bg-white p-8 rounded-[3rem] border border-stone-100 shadow-2xl shadow-stone-200/20 sticky top-28 overflow-hidden group">
            <h2 className="text-xl font-bold mb-8 flex items-center gap-2 text-stone-800 relative font-sans underline decoration-orange-200 decoration-4 underline-offset-4">
              <Plus className="text-orange-800" size={20} /> Recomendar
            </h2>
            <form onSubmit={guardar} className="space-y-6 font-sans text-sm relative">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Título</label>
                <input type="text" required className="w-full bg-stone-50 p-4 rounded-2xl border border-stone-50 focus:bg-white outline-none transition-all font-medium"
                  value={nuevo.titulo} onChange={e => setNuevo({...nuevo, titulo: e.target.value})} placeholder="Ej: Rayuela" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Autor</label>
                <input type="text" required className="w-full bg-stone-50 p-4 rounded-2xl border border-stone-50 focus:bg-white outline-none transition-all font-medium"
                  value={nuevo.autor} onChange={e => setNuevo({...nuevo, autor: e.target.value})} placeholder="Julio Cortázar" />
              </div>
              <div className="grid grid-cols-2 gap-4 py-2 border-y border-stone-50">
                <div className="space-y-2 text-center">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">Nota: {nuevo.puntuacion}⭐</label>
                  <input type="range" min="1" max="5" className="w-full accent-stone-900 mt-4 cursor-pointer"
                    value={nuevo.puntuacion} onChange={e => setNuevo({...nuevo, puntuacion: parseInt(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1 text-right block">Género</label>
                  <select className="w-full bg-stone-50 p-4 rounded-2xl border-none outline-none cursor-pointer font-bold text-stone-600 appearance-none shadow-sm"
                    value={nuevo.genero} onChange={e => setNuevo({...nuevo, genero: e.target.value})}>
                    <option>Ficción</option><option>Ensayo</option><option>Misterio</option><option>Fantasía</option><option>Poesía</option>
                  </select>
                </div>
              </div>
              <textarea className="w-full bg-stone-50 p-5 rounded-[2.5rem] h-40 focus:bg-white outline-none resize-none transition-all italic text-stone-600 font-medium leading-relaxed font-serif"
                value={nuevo.resena} onChange={e => setNuevo({...nuevo, resena: e.target.value})} placeholder="¿Por qué deberíamos leerlo?" />
              <button type="submit" disabled={enviando} className="w-full bg-stone-900 text-white font-black py-5 rounded-[2rem] hover:bg-black active:scale-[0.98] transition-all shadow-2xl shadow-stone-300 flex items-center justify-center gap-3 uppercase tracking-widest text-[10px]">
                {enviando ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                {enviando ? 'Guardando...' : 'Añadir al Club'}
              </button>
            </form>
          </section>
        </div>

        {/* Estantería */}
        <div className="lg:col-span-8">
          <h2 className="text-4xl font-black text-stone-800 tracking-tight flex items-center gap-4 mb-10 italic">
            <BookOpen className="text-orange-900" size={36} /> 
            <span>Estantería <span className="text-stone-300 font-normal italic font-serif text-2xl">compartida</span></span>
          </h2>

          {cargando ? (
            <div className="flex flex-col items-center justify-center py-40 text-stone-300 italic">
              <Loader2 className="animate-spin mb-6" size={48} />
              <p className="font-sans font-bold text-xs uppercase tracking-widest">Sincronizando biblioteca...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filtrados.map(l => (
                <article key={l.id} className="bg-white p-8 rounded-[3.5rem] border border-stone-50 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-700 group relative flex flex-col h-full overflow-hidden">
                  <button onClick={() => borrar(l.id)} className="absolute top-8 right-8 text-stone-100 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2 z-10">
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

                  <h3 className="text-2xl font-black text-stone-900 leading-[1.1] mb-2 italic">{l.titulo}</h3>
                  <div className="flex items-center gap-2 text-stone-400 italic text-sm font-sans">
                    <ChevronRight size={14} className="text-orange-800" />
                    <span>{l.autor}</span>
                  </div>
                  
                  {l.resena && (
                    <div className="bg-stone-50/70 p-7 rounded-[2.5rem] mb-10 mt-6 flex-1 relative border-l-2 border-stone-100 italic text-stone-600 text-sm leading-relaxed font-serif z-10">
                      <Quote className="absolute -top-3 -right-3 text-stone-100 opacity-50" size={32} />
                      "{l.resena}"
                    </div>
                  )}

                  <div className="mt-auto pt-6 border-t border-stone-50 flex justify-between items-center text-[9px] text-stone-300 font-bold uppercase tracking-[0.15em] font-sans">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-stone-800 text-white flex items-center justify-center text-[8px] font-black">
                        {l.usuario?.charAt(7) || 'L'}
                      </div>
                      <span>{l.usuario}</span>
                    </div>
                    <span>{new Date(l.fecha).toLocaleDateString()}</span>
                  </div>
                </article>
              ))}

              {filtrados.length === 0 && (
                <div className="col-span-full py-40 text-center border-2 border-dashed border-stone-100 rounded-[4rem] bg-stone-50/20">
                  <Library className="mx-auto text-stone-100 mb-6 scale-150 opacity-20" size={64} />
                  <p className="text-stone-300 italic text-lg">La biblioteca está vacía...</p>
                  <p className="text-stone-200 font-sans font-bold text-[10px] mt-4 uppercase tracking-[0.3em]">¡Sé el primero en recomendar!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
