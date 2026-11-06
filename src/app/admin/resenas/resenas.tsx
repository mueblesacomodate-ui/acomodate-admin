'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import Link from 'next/link';
import { db } from '@/app/lib/firebase';
import AdminSidebar from '@/app/components/AdminSidebar';

interface Reseña {
  id: string;
  nombre: string;
  fecha: string;
  estrellas: number;
  comentario: string;
}

export default function AdminReseñasPage() {
  const [reseñas, setReseñas] = useState<Reseña[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [modalNuevo, setModalNuevo] = useState(false);

  const [nuevaReseña, setNuevaReseña] = useState({
    nombre: '',
    fecha: '',
    estrellas: 5,
    comentario: '',
  });

  useEffect(() => {
    async function cargarReseñas() {
      try {
        setCargando(true);
        const querySnap = await getDocs(collection(db, 'reseñas'));
        const lista: Reseña[] = [];
        querySnap.forEach((d) => {
          lista.push({ id: d.id, ...d.data() } as Reseña);
        });
        setReseñas(lista);
      } catch (error) {
        console.error('Error cargando reseñas:', error);
      } finally {
        setCargando(false);
      }
    }

    cargarReseñas();
  }, []);

  const handleAgregarReseña = (e: React.FormEvent) => {
    e.preventDefault();
    const item: Reseña = {
      id: `RES-${Date.now()}`,
      ...nuevaReseña,
    };
    setReseñas((prev) => [...prev, item]);
    setModalNuevo(false);
    setNuevaReseña({ nombre: '', fecha: '', estrellas: 5, comentario: '' });
  };

  const handleGuardarCambios = async () => {
    try {
      setGuardando(true);
      // Guardar batch de reseñas en Firestore
      for (const r of reseñas) {
        await setDoc(doc(db, 'reseñas', r.id), r);
      }
      alert('Reseñas guardadas correctamente.');
    } catch (error) {
      console.error('Error al guardar reseñas:', error);
      alert('Ocurrió un error al guardar.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex font-sans text-[#1A1A1A]">
      
      <AdminSidebar />

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-8 md:p-12 space-y-6 overflow-y-auto">
        
        {/* BARRA DE TÍTULO Y BOTÓN GUARDAR */}
        <div className="flex justify-between items-start border-b border-gray-200 pb-4">
          <div>
            <span className="text-[10px] tracking-[0.3em] uppercase text-gray-500 block font-sans mb-1">
              ACOMÓDATE MUEBLES · REPUTACIÓN
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-normal text-[#1A1A1A]">
              Reseñas
            </h2>
            <span className="text-xs text-gray-400 font-light">Se ve en: /</span>
          </div>
          <button
            onClick={handleGuardarCambios}
            disabled={guardando}
            className="bg-[#1A1A1A] text-white px-6 py-3 rounded-xl text-xs uppercase tracking-widest font-semibold hover:bg-[#8C6D53] transition-colors cursor-pointer shadow-sm disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>

        {/* CONTENEDOR DE RESEÑAS */}
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-[#1A1A1A]">
              Reseñas ({reseñas.length} de 30)
            </h3>
            <button
              onClick={() => setModalNuevo(true)}
              className="border border-[#1A1A1A] text-[#1A1A1A] px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold hover:bg-[#1A1A1A] hover:text-white transition-colors cursor-pointer"
            >
              + Agregar
            </button>
          </div>

          <p className="text-xs text-gray-500 font-light leading-relaxed">
            Cópialas de tu perfil de Google, con el nombre, la fecha y las estrellas que indica allí. El sitio las muestra en este orden. Sin ninguna visible, la sección no aparece.
          </p>

          {cargando ? (
            <p className="text-xs text-gray-400 py-4 animate-pulse uppercase tracking-wider">Cargando reseñas...</p>
          ) : reseñas.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 uppercase tracking-wider">
              Todavía no hay ninguna. Lo que esté vacío no se muestra en el sitio.
            </p>
          ) : (
            <div className="space-y-4 pt-2">
              {reseñas.map((res, index) => (
                <div key={res.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2 text-xs">
                  <div className="flex justify-between font-semibold text-[#1A1A1A]">
                    <span>{index + 1}. {res.nombre} (<span className="text-[#8C6D53]">{res.estrellas} ★</span>)</span>
                    <span className="text-gray-400 font-normal">{res.fecha}</span>
                  </div>
                  <p className="text-gray-600 font-light leading-relaxed">{res.comentario}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-[11px] text-gray-400 font-light">
          El panel no tiene vista previa: la vista exacta es el sitio web, unos minutos después de publicar.
        </p>

      </main>

      {/* MODAL AGREGAR RESEÑA */}
      {modalNuevo && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-2xl max-w-md w-full border border-gray-100 shadow-2xl space-y-4 text-xs">
            <h3 className="font-serif text-xl text-[#1A1A1A]">Nueva Reseña</h3>
            <form onSubmit={handleAgregarReseña} className="space-y-4">
              <div>
                <label className="block mb-1.5 font-semibold uppercase tracking-wider text-gray-700">Nombre del Cliente</label>
                <input
                  type="text"
                  required
                  value={nuevaReseña.nombre}
                  onChange={(e) => setNuevaReseña({ ...nuevaReseña, nombre: e.target.value })}
                  placeholder="Ej. María Fernanda"
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8C6D53]"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-semibold uppercase tracking-wider text-gray-700">Fecha de la reseña</label>
                <input
                  type="text"
                  required
                  value={nuevaReseña.fecha}
                  onChange={(e) => setNuevaReseña({ ...nuevaReseña, fecha: e.target.value })}
                  placeholder="Ej. Hace 2 semanas"
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8C6D53]"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-semibold uppercase tracking-wider text-gray-700">Estrellas (1 al 5)</label>
                <select
                  value={nuevaReseña.estrellas}
                  onChange={(e) => setNuevaReseña({ ...nuevaReseña, estrellas: Number(e.target.value) })}
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8C6D53]"
                >
                  <option value={5}>5 Estrellas</option>
                  <option value={4}>4 Estrellas</option>
                  <option value={3}>3 Estrellas</option>
                </select>
              </div>

              <div>
                <label className="block mb-1.5 font-semibold uppercase tracking-wider text-gray-700">Comentario</label>
                <textarea
                  required
                  rows={3}
                  value={nuevaReseña.comentario}
                  onChange={(e) => setNuevaReseña({ ...nuevaReseña, comentario: e.target.value })}
                  placeholder="Excelente calidad y acabado de los muebles..."
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8C6D53]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNuevo(false)}
                  className="w-1/2 py-3 bg-white border border-gray-200 rounded-xl uppercase tracking-wider font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-[#1A1A1A] text-white rounded-xl uppercase tracking-wider font-semibold hover:bg-[#8C6D53] transition-colors cursor-pointer shadow-sm"
                >
                  Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}