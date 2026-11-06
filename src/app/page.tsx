'use client';

import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from './lib/firebase';
import AdminSidebar from './components/AdminSidebar';

interface Orden {
  id: string;
  orderId?: string;
  cliente: {
    nombreApellido: string;
    celular: string;
  };
  total: number;
  estado: string;
  esAMedida?: boolean;
  notificacionWhatsAppEnviada?: boolean;
  fechaTexto?: string;
  fechaCreacion?: any;
}

export default function HomeAdminPage() {
  const router = useRouter();
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarOrdenes() {
      try {
        setCargando(true);
        const q = query(collection(db, 'pedidos'), orderBy('fechaCreacion', 'desc'));
        const querySnap = await getDocs(q);
        const lista: Orden[] = [];
        querySnap.forEach((docSnap) => {
          lista.push({ id: docSnap.id, ...docSnap.data() } as Orden);
        });
        setOrdenes(lista);
      } catch (error) {
        console.error('Error cargando órdenes:', error);
      } finally {
        setCargando(false);
      }
    }

    cargarOrdenes();
  }, []);

  const pedidosNuevos = ordenes.filter(
    (o) => 
      o.estado === 'nuevo' || 
      o.estado === 'Pendiente' || 
      o.estado === 'Pendiente WhatsApp' ||
      o.estado === 'Pendiente A Medida'
  ).length;

  const solicitudesAMedida = ordenes.filter(
    (o) => o.esAMedida || o.estado === 'Pendiente A Medida' || o.estado === 'cotizacion'
  ).length;

  const avisosWhatsApp = ordenes.filter((o) => !o.notificacionWhatsAppEnviada).length;
  
  const saldosPorRecaudar = ordenes
    .filter((o) => o.estado !== 'entregado' && o.estado !== 'anulado')
    .reduce((acc, o) => acc + (o.total || 0), 0);

  const fechaHoy = new Date().toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex font-sans text-[#1A1A1A]">
      
      <AdminSidebar />

      {/* CONTENIDO PRINCIPAL DEL DASHBOARD */}
      <main className="flex-1 p-8 md:p-12 space-y-10 overflow-y-auto">
        
        <header className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-2 text-gray-500">
            <span>Sitio al día</span>
            <span>•</span>
            <span>Última comprobación: hoy</span>
          </div>
          <Link
            href="/admin/productos"
            className="border border-gray-200 bg-white px-4 py-1.5 rounded-lg text-[#1A1A1A] hover:bg-[#FDFBF7] font-medium transition-colors"
          >
            Ver Catálogo
          </Link>
        </header>

        <div className="flex justify-between items-end border-b border-gray-200 pb-4">
          <div>
            <span className="text-[10px] tracking-[0.3em] uppercase text-gray-400 block font-sans mb-1">
              PANEL DE CONTROL
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-normal text-[#1A1A1A]">
              ACOMÓDATE MUEBLES
            </h2>
          </div>
          <span className="text-xs text-gray-400 uppercase tracking-widest">{fechaHoy}</span>
        </div>

        {/* 4 TARJETAS MÉTRICAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#F8EFEA] rounded-3xl p-6 space-y-4 shadow-sm border border-[#EFE3DB]">
            <span className="text-xs uppercase tracking-wider text-[#8C6D53] font-medium block">
              Pedidos nuevos
            </span>
            <span className="text-4xl font-serif font-semibold text-[#8C6D53] block">
              {cargando ? '...' : pedidosNuevos}
            </span>
          </div>

          <div className="bg-[#FAF3E0] rounded-3xl p-6 space-y-4 shadow-sm border border-[#EFE5C8]">
            <span className="text-xs uppercase tracking-wider text-[#7A6435] font-medium block">
              Cotizaciones A Medida
            </span>
            <span className="text-4xl font-serif font-semibold text-[#7A6435] block">
              {cargando ? '...' : solicitudesAMedida}
            </span>
          </div>

          <div className="bg-[#EAF5EF] rounded-3xl p-6 space-y-4 shadow-sm border border-[#D5EADF]">
            <span className="text-xs uppercase tracking-wider text-[#2D5A44] font-medium block">
              Avisos WhatsApp
            </span>
            <span className="text-4xl font-serif font-semibold text-[#2D5A44] block">
              {cargando ? '...' : avisosWhatsApp}
            </span>
          </div>

          <div className="bg-[#1A1A1A] text-white rounded-3xl p-6 space-y-4 shadow-sm">
            <span className="text-xs uppercase tracking-wider text-gray-300 font-medium block">
              Saldos por recaudar
            </span>
            <span className="text-3xl font-serif font-semibold block">
              ${cargando ? '...' : saldosPorRecaudar.toLocaleString('es-CO')} COP
            </span>
          </div>
        </div>

        {/* SECCIÓN INFERIOR */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* PEDIDOS RECIENTES */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h3 className="font-serif text-xl text-[#1A1A1A]">
                Pedidos y Proyectos recientes
              </h3>
              <Link href="/admin/pedidos" className="text-xs underline font-medium text-[#1A1A1A] hover:text-[#8C6D53]">
                Ver todos
              </Link>
            </div>

            {ordenes.length === 0 ? (
              <p className="text-xs text-gray-400 py-8">
                Nada pendiente por ahora en la carpintería. Buen trabajo.
              </p>
            ) : (
              <div className="divide-y divide-gray-100">
                {ordenes.slice(0, 5).map((ord) => {
                  const displayId = ord.orderId || ord.id;
                  return (
                    <div
                      key={ord.id}
                      onClick={() => router.push(ord.esAMedida ? '/admin/cotizaciones' : '/admin/pedidos')}
                      className="py-3 flex justify-between items-center text-xs hover:bg-[#FAF8F5] px-3 rounded-xl transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">
                            {ord.cliente?.nombreApellido || 'Cliente'}
                          </span>
                          {ord.esAMedida && (
                            <span className="text-[9px] uppercase font-bold text-[#8C6D53] bg-[#F8EFEA] px-2 py-0.5 rounded-full">
                              A Medida
                            </span>
                          )}
                          <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            {displayId}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {ord.fechaTexto || 'Fecha no registrada'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-serif font-semibold text-sm text-[#1A1A1A]">
                          ${ord.total?.toLocaleString('es-CO')} COP
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* PRÓXIMAS ENTREGAS DE TALLER */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h3 className="font-serif text-xl text-[#1A1A1A]">
                Próximas entregas de taller
              </h3>
              <span className="text-xs text-gray-400">7 días</span>
            </div>

            <div className="space-y-4 text-xs text-gray-500">
              <p>Ningún mueble programado para entrega en los próximos 7 días.</p>
              <div className="pt-2 border-t border-gray-100">
                <p><strong className="text-[#1A1A1A]">Entregas atrasadas:</strong> ninguna.</p>
                <p className="text-[11px] pt-2 leading-relaxed text-gray-400">
                  Recuerda verificar con el área de producción los acabados y tiempos de secado de maderas antes de confirmar despacho al cliente.
                </p>
              </div>
            </div>
          </div>

        </div>

      </main>

    </div>
  );
}