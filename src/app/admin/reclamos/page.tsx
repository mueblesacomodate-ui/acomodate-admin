'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import { db } from '@/app/lib/firebase';
import AdminSidebar from '@/app/components/AdminSidebar';

interface Reclamo {
  id: string;
  cliente: string;
  tipo: string;
  estado: string;
  fecha: string;
  mensaje: string;
}

const FILTROS_ESTADO = [
  { id: 'abiertas', nombre: 'Abiertas' },
  { id: 'por_vencer', nombre: 'Por vencer' },
  { id: 'recibidas', nombre: 'Recibidas' },
  { id: 'en_tramite', nombre: 'En trámite' },
  { id: 'respondidas', nombre: 'Respondidas' },
  { id: 'todas', nombre: 'Todas' },
];

export default function AdminReclamosPage() {
  const [reclamos, setReclamos] = useState<Reclamo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('abiertas');
  const [filtroTipo, setFiltroTipo] = useState('todos');

  useEffect(() => {
    async function cargarReclamos() {
      try {
        setCargando(true);
        const querySnap = await getDocs(collection(db, 'reclamos'));
        const lista: Reclamo[] = [];
        querySnap.forEach((docSnap) => {
          lista.push({ id: docSnap.id, ...docSnap.data() } as Reclamo);
        });
        setReclamos(lista);
      } catch (error) {
        console.error('Error cargando quejas y reclamos:', error);
      } finally {
        setCargando(false);
      }
    }

    cargarReclamos();
  }, []);

  const reclamosFiltrados = reclamos.filter((r) => {
    const coincideEstado = filtroEstado === 'todas' ? true : r.estado === filtroEstado;
    const coincideTipo = filtroTipo === 'todos' ? true : r.tipo === filtroTipo;
    return coincideEstado && coincideTipo;
  });

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex font-sans text-[#1A1A1A]">
      
      {/* SIDEBAR NAVEGACIÓN LATERAL */}
      <AdminSidebar />

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-8 md:p-12 space-y-6 overflow-y-auto">
        
        <div className="flex justify-between items-start border-b border-gray-200 pb-4">
          <div>
            <span className="text-[10px] tracking-[0.3em] uppercase text-gray-500 block font-sans mb-1">
              ACOMÓDATE MUEBLES · ATENCIÓN AL CLIENTE
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-normal text-[#1A1A1A]">
              Quejas y reclamos
            </h2>
          </div>
          <span className="text-xs text-gray-400 font-light">Primero lo que vence antes</span>
        </div>

        {/* CHIPS DE ESTADO */}
        <div className="flex flex-wrap gap-2">
          {FILTROS_ESTADO.map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltroEstado(f.id)}
              className={`px-4 py-2 rounded-xl text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer ${
                filtroEstado === f.id
                  ? 'bg-[#1A1A1A] text-white font-semibold'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.nombre}
            </button>
          ))}
        </div>

        {/* DESPLEGABLE DE TIPO */}
        <div className="w-full sm:w-72">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 text-xs font-medium text-[#1A1A1A] focus:outline-none focus:border-[#8C6D53] shadow-sm cursor-pointer"
          >
            <option value="todos">Todos los tipos</option>
            <option value="garantia">Garantía o daño</option>
            <option value="retraso">Retraso en entrega</option>
            <option value="retracto">Retracto / Devolución</option>
          </select>
        </div>

        {/* CONTENEDOR DE RESULTADOS */}
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm min-h-[160px]">
          {cargando ? (
            <p className="text-xs uppercase tracking-widest text-gray-400 text-center py-8 animate-pulse">
              Cargando reclamos...
            </p>
          ) : reclamosFiltrados.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center uppercase tracking-wider">
              No hay quejas en este grupo.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {reclamosFiltrados.map((rec) => (
                <div key={rec.id} className="py-4 space-y-1 text-xs">
                  <div className="flex justify-between font-semibold text-[#1A1A1A]">
                    <span>{rec.cliente} — <span className="text-[#8C6D53]">{rec.tipo}</span></span>
                    <span className="text-gray-400 font-normal">{rec.fecha}</span>
                  </div>
                  <p className="text-gray-600 font-light leading-relaxed">{rec.mensaje}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

    </div>
  );
}