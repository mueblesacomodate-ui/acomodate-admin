'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, orderBy, query } from 'firebase/firestore';
import Link from 'next/link';
import { db } from '../lib/firebase';

interface Cotizacion {
  id: string;
  tipoMueble: string;
  medidas: string;
  necesidad: string;
  ciudad: string;
  nombre: string;
  celular: string;
  correo: string;
  estado: 'pendiente' | 'revisado' | 'hecho' | 'descartado';
  creadoEn?: any;
}

export default function CotizacionesAdminPage() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [cargando, setCargando] = useState(true);

  async function cargarCotizaciones() {
    try {
      setCargando(true);
      const q = query(collection(db, 'cotizaciones_medida'));
      const querySnapshot = await getDocs(q);
      const lista: Cotizacion[] = [];
      querySnapshot.forEach((docSnap) => {
        lista.push({ id: docSnap.id, ...docSnap.data() } as Cotizacion);
      });
      setCotizaciones(lista);
    } catch (error) {
      console.error('Error al cargar cotizaciones:', error);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarCotizaciones();
  }, []);

  const cambiarEstado = async (id: string, nuevoEstado: Cotizacion['estado']) => {
    try {
      const docRef = doc(db, 'cotizaciones_medida', id);
      await updateDoc(docRef, { estado: nuevoEstado });
      setCotizaciones((prev) =>
        prev.map((item) => (item.id === id ? { ...item, estado: nuevoEstado } : item))
      );
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      alert('No se pudo actualizar el estado.');
    }
  };

  const badgeEstado = (estado: Cotizacion['estado']) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'revisado':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'hecho':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'descartado':
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <main className="min-h-screen bg-[#FDFBF7] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-6">
          <div>
            <span className="text-[10px] tracking-[0.3em] uppercase text-gray-500 block font-sans">
              PANEL DE CONTROL
            </span>
            <h1 className="font-serif text-3xl text-[#1A1A1A]">Cotizaciones A Medida Recibidas</h1>
          </div>
          <Link
            href="/"
            className="text-xs uppercase tracking-widest text-gray-600 hover:text-black font-medium transition-colors"
          >
            ← Volver al Dashboard
          </Link>
        </div>

        {cargando ? (
          <p className="text-xs uppercase tracking-widest text-gray-400 animate-pulse py-20 text-center">
            Cargando cotizaciones...
          </p>
        ) : cotizaciones.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500 font-light">No hay solicitudes registradas todavía.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {cotizaciones.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] uppercase font-semibold px-2.5 py-1 rounded-full border ${badgeEstado(item.estado)}`}>
                      {item.estado}
                    </span>
                    <span className="text-xs text-gray-400 font-sans">
                      {item.ciudad}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl text-[#1A1A1A]">
                    {item.tipoMueble} <span className="text-sm text-gray-400 font-sans font-normal">({item.nombre})</span>
                  </h3>

                  <p className="text-xs text-gray-600 font-light">
                    <strong>Medidas:</strong> {item.medidas}
                  </p>
                  <p className="text-xs text-gray-600 font-light">
                    <strong>Necesidad:</strong> {item.necesidad}
                  </p>
                  <p className="text-xs text-gray-500 font-sans">
                    📞 <a href={`https://wa.me/57${item.celular}`} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline font-medium">{item.celular}</a> | ✉️ {item.correo}
                  </p>
                </div>

                {/* SELECTOR DE CAMBIO DE ESTADO */}
                <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                    Cambiar Estado
                  </label>
                  <select
                    value={item.estado}
                    onChange={(e) => cambiarEstado(item.id, e.target.value as Cotizacion['estado'])}
                    className="border border-gray-200 rounded-xl p-2.5 text-xs text-[#1A1A1A] font-medium bg-white focus:outline-none focus:border-[#8C6D53]"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="revisado">Revisado</option>
                    <option value="hecho">Hecho</option>
                    <option value="descartado">Descartado</option>
                  </select>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}