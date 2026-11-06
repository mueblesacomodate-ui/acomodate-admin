'use client';

import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import Image from 'next/image';
import { db } from '@/app/lib/firebase';
import AdminSidebar from '@/app/components/AdminSidebar';

interface ItemCarrito {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen: string;
}

interface Orden {
  id: string;
  orderId?: string;
  cliente: {
    nombreApellido?: string;
    celular?: string;
    correo?: string;
    departamento?: string;
    ciudad?: string;
    direccion?: string;
    indicaciones?: string;
  };
  items: ItemCarrito[];
  total: number;
  estado: string; // 'nuevo' | 'revision' | 'con_saldo' | 'aviso_enviar' | 'confirmado' | 'en_fabricacion' | 'listo' | 'despachado' | 'entregado' | 'anulado' | 'sin_pagar' | 'Pendiente' | 'Pendiente WhatsApp'
  metodoPago?: string;
  fechaTexto?: string;
  fechaCreacion?: any;
}

const FILTROS = [
  { id: 'activos', nombre: 'Activos' },
  { id: 'revision', nombre: 'Para revisión' },
  { id: 'con_saldo', nombre: 'Con saldo' },
  { id: 'aviso_enviar', nombre: 'Con aviso por enviar' },
  { id: 'confirmado', nombre: 'Confirmado' },
  { id: 'en_fabricacion', nombre: 'En fabricación' },
  { id: 'listo', nombre: 'Listo' },
  { id: 'despachado', nombre: 'Despachado' },
  { id: 'entregado', nombre: 'Entregado' },
  { id: 'anulado', nombre: 'Anulado' },
  { id: 'sin_pagar', nombre: 'Sin pagar' },
];

export default function AdminPedidosPage() {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroActivo, setFiltroActivo] = useState('activos');
  const [busqueda, setBusqueda] = useState('');
  
  // Estado para el pedido seleccionado (Drawer lateral)
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<Orden | null>(null);
  const [guardandoEstado, setGuardandoEstado] = useState(false);

  useEffect(() => {
    async function cargarPedidos() {
      try {
        setCargando(true);
        // Consulta a Firestore ordenada por fechaCreacion descendente
        const q = query(collection(db, 'pedidos'), orderBy('fechaCreacion', 'desc'));
        const querySnap = await getDocs(q);
        const lista: Orden[] = [];
        querySnap.forEach((docSnap) => {
          lista.push({ id: docSnap.id, ...docSnap.data() } as Orden);
        });

        // Ordenamiento secundario de respaldo en JS para registros sin timestamp
        lista.sort((a, b) => {
          const fechaA = a.fechaCreacion?.seconds ? a.fechaCreacion.seconds * 1000 : 0;
          const fechaB = b.fechaCreacion?.seconds ? b.fechaCreacion.seconds * 1000 : 0;
          return fechaB - fechaA;
        });

        setOrdenes(lista);
      } catch (error) {
        console.error('Error al cargar los pedidos:', error);
      } finally {
        setCargando(false);
      }
    }

    cargarPedidos();
  }, []);

  // Función para cambiar el estado del pedido en Firestore
  const cambiarEstado = async (nuevoEstado: string) => {
    if (!ordenSeleccionada) return;
    try {
      setGuardandoEstado(true);
      const docRef = doc(db, 'pedidos', ordenSeleccionada.id);
      await updateDoc(docRef, { estado: nuevoEstado });

      // Actualizar estado local
      setOrdenes((prev) =>
        prev.map((ord) => (ord.id === ordenSeleccionada.id ? { ...ord, estado: nuevoEstado } : ord))
      );
      setOrdenSeleccionada((prev) => (prev ? { ...prev, estado: nuevoEstado } : null));
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      alert('No se pudo actualizar el estado.');
    } finally {
      setGuardandoEstado(false);
    }
  };

  // Filtrado dinámico por estado y búsqueda
  const ordenesFiltradas = ordenes.filter((ord) => {
    let cumpleFiltro = true;
    if (filtroActivo === 'activos') {
      cumpleFiltro = ord.estado !== 'entregado' && ord.estado !== 'anulado' && ord.estado !== 'sin_pagar';
    } else {
      cumpleFiltro = ord.estado === filtroActivo;
    }

    const idOrdenStr = ord.orderId || ord.id;
    const coincideBusqueda =
      idOrdenStr.toLowerCase().includes(busqueda.toLowerCase()) ||
      (ord.cliente?.nombreApellido && ord.cliente.nombreApellido.toLowerCase().includes(busqueda.toLowerCase())) ||
      (ord.cliente?.celular && ord.cliente.celular.includes(busqueda));

    return cumpleFiltro && coincideBusqueda;
  });

  // Función para abrir WhatsApp al cliente con mensaje preconfigurado
  const hablarPorWhatsApp = (ord: Orden) => {
    const celular = ord.cliente?.celular || '';
    const celularLimpio = celular.replace(/\D/g, '');
    
    if (!celularLimpio) {
      alert('Este pedido no tiene un número de celular válido registrado.');
      return;
    }

    const identificador = ord.orderId || ord.id;
    const mensaje = `Hola ${ord.cliente?.nombreApellido || 'Cliente'}, te hablo del taller de Acomódate Muebles en relación a tu pedido *#${identificador}*. ¿Cómo te podemos ayudar?`;
    
    const urlWp = `https://wa.me/57${celularLimpio}?text=${encodeURIComponent(mensaje)}`;
    window.open(urlWp, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex font-sans text-[#1A1A1A]">
      <AdminSidebar />

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-8 md:p-12 space-y-8 overflow-y-auto">
        
        {/* ENCABEZADO Y BUSCADOR */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
          <div>
            <span className="text-[10px] tracking-[0.3em] uppercase text-gray-500 block font-sans mb-1">
              ACOMÓDATE MUEBLES · GESTIÓN
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-normal text-[#1A1A1A]">
              Pedidos y Ventas
            </h2>
          </div>

          <div className="w-full sm:w-80">
            <input
              type="text"
              placeholder="Buscar por ID o teléfono/nombre"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-white px-4 py-2.5 rounded-xl border border-gray-200 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#8C6D53] shadow-sm"
            />
          </div>
        </div>

        {/* CHIPS DE FILTRO */}
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltroActivo(f.id)}
              className={`px-4 py-2 rounded-xl text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer ${
                filtroActivo === f.id
                  ? 'bg-[#1A1A1A] text-white font-semibold'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.nombre}
            </button>
          ))}
        </div>

        {/* TABLA O CONTENEDOR DE RESULTADOS */}
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm min-h-[200px]">
          {cargando ? (
            <p className="text-xs uppercase tracking-widest text-gray-400 text-center py-12 animate-pulse">
              Cargando pedidos de la base de datos...
            </p>
          ) : ordenesFiltradas.length === 0 ? (
            <p className="text-xs text-gray-400 py-8 text-center uppercase tracking-wider">
              No hay pedidos en este grupo.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {ordenesFiltradas.map((ord) => {
                const displayId = ord.orderId || ord.id;
                return (
                  <div
                    key={ord.id}
                    onClick={() => setOrdenSeleccionada(ord)}
                    className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs hover:bg-[#FAF8F5] px-4 rounded-xl transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#1A1A1A]">{displayId}</span>
                        <span className="uppercase text-[10px] px-2.5 py-0.5 rounded-full bg-gray-100 text-[#8C6D53] font-semibold">
                          {ord.estado}
                        </span>
                        {ord.metodoPago && (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                            {ord.metodoPago}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 mt-1 font-light">
                        {ord.cliente?.nombreApellido || 'Cliente sin nombre'} — Tel: {ord.cliente?.celular || 'S/N'} {ord.fechaTexto ? `— ${ord.fechaTexto}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-serif font-semibold text-base text-[#1A1A1A]">
                        ${ord.total?.toLocaleString('es-CO')} COP
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-[11px] text-gray-400 font-light">
          Haz clic en cualquier pedido para ver las especificaciones de entrega, cambiar el estado de fabricación o comunicarte por WhatsApp.
        </p>

      </main>

      {/* DRAWER LATERAL DE DETALLE DE PEDIDO */}
      {ordenSeleccionada && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-lg bg-[#FAF9F6] h-full p-8 overflow-y-auto shadow-2xl relative flex flex-col justify-between">
            
            <div className="space-y-6">
              {/* Cabecera del Drawer */}
              <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#8C6D53] block font-sans font-semibold">
                    DETALLE DEL PEDIDO
                  </span>
                  <h3 className="font-serif text-xl font-semibold text-[#1A1A1A]">
                    {ordenSeleccionada.orderId || ordenSeleccionada.id}
                  </h3>
                </div>
                <button
                  onClick={() => setOrdenSeleccionada(null)}
                  className="text-xl font-light text-[#1A1A1A] hover:text-[#8C6D53] cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Botón WhatsApp rápido */}
              <button
                type="button"
                onClick={() => hablarPorWhatsApp(ordenSeleccionada)}
                className="w-full bg-[#25D366] text-white hover:bg-[#20ba5a] transition-colors py-3.5 rounded-xl text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>📱</span>
                <span>Contactar Cliente por WhatsApp</span>
              </button>

              {/* Estado y Cambio de Estado */}
              <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-2">
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-500">
                  Estado Actual del Pedido
                </label>
                <select
                  value={ordenSeleccionada.estado}
                  onChange={(e) => cambiarEstado(e.target.value)}
                  disabled={guardandoEstado}
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-[#1A1A1A] focus:outline-none focus:border-[#8C6D53]"
                >
                  {FILTROS.filter(f => f.id !== 'activos').map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nombre}
                    </option>
                  ))}
                  <option value="Pendiente">Pendiente</option>
                  <option value="Pendiente WhatsApp">Pendiente WhatsApp</option>
                </select>
                {ordenSeleccionada.fechaTexto && (
                  <p className="text-[10px] text-gray-400 pt-1">
                    Realizado el: {ordenSeleccionada.fechaTexto}
                  </p>
                )}
              </div>

              {/* Información del Cliente */}
              <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-2 text-xs">
                <h4 className="font-semibold uppercase tracking-wider text-[#1A1A1A] border-b border-gray-100 pb-1">
                  Información del Cliente
                </h4>
                <p><strong className="text-gray-700">Nombre:</strong> {ordenSeleccionada.cliente?.nombreApellido || 'No especificado'}</p>
                <p><strong className="text-gray-700">Celular:</strong> {ordenSeleccionada.cliente?.celular || 'No especificado'}</p>
                <p><strong className="text-gray-700">Correo:</strong> {ordenSeleccionada.cliente?.correo || 'No especificado'}</p>
                <p><strong className="text-gray-700">Ciudad / Depto:</strong> {ordenSeleccionada.cliente?.ciudad}, {ordenSeleccionada.cliente?.departamento}</p>
                <p><strong className="text-gray-700">Dirección:</strong> {ordenSeleccionada.cliente?.direccion}</p>
                {ordenSeleccionada.cliente?.indicaciones && (
                  <p><strong className="text-gray-700">Indicaciones:</strong> {ordenSeleccionada.cliente.indicaciones}</p>
                )}
              </div>

              {/* Listado de Productos */}
              <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-4 text-xs">
                <h4 className="font-semibold uppercase tracking-wider text-[#1A1A1A] border-b border-gray-100 pb-1">
                  Muebles Adquiridos ({ordenSeleccionada.items?.length || 0})
                </h4>

                <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                  {ordenSeleccionada.items?.map((item, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {item.imagen && (
                          <div className="relative w-12 h-14 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                            <Image src={item.imagen} alt={item.nombre} fill className="object-cover" />
                          </div>
                        )}
                        <div>
                          <p className="font-serif font-medium text-sm text-[#1A1A1A]">{item.nombre}</p>
                          <p className="text-[11px] text-gray-500">Cantidad: {item.cantidad}</p>
                        </div>
                      </div>
                      <p className="font-serif font-semibold text-sm text-[#1A1A1A]">
                        ${(item.precio * item.cantidad).toLocaleString('es-CO')} COP
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-sm font-bold">
                  <span>Total Orden:</span>
                  <span className="font-serif text-base text-[#1A1A1A]">${ordenSeleccionada.total?.toLocaleString('es-CO')} COP</span>
                </div>
              </div>

            </div>

            {/* Pie del Drawer */}
            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={() => setOrdenSeleccionada(null)}
                className="w-full bg-[#1A1A1A] text-white hover:bg-[#8C6D53] transition-colors py-3.5 rounded-xl text-xs uppercase tracking-widest font-semibold cursor-pointer shadow-sm"
              >
                Cerrar Panel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}