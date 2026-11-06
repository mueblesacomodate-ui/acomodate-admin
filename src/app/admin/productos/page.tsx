'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/app/lib/firebase';

interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  subcategoria?: string;
  precio: number;
  imagen: string;
  descripcion?: string;
}

export default function ListadoProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');

  const cargarProductos = async () => {
    try {
      setCargando(true);
      const querySnapshot = await getDocs(collection(db, 'productos'));
      const docs: Producto[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        docs.push({
          id: docSnap.id,
          nombre: data.nombre || 'Sin nombre',
          categoria: data.categoria || 'cuerpo-entero',
          subcategoria: data.subcategoria || '',
          precio: Number(data.precio) || 0,
          imagen: data.imagen || '',
          descripcion: data.descripcion || '',
        });
      });
      setProductos(docs);
    } catch (error) {
      console.error('Error al cargar espejos:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const handleEliminar = async (id: string, nombreProd: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${nombreProd}"? Esta acción removerá el espejo del catálogo.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'productos', id));
      alert('Espejo eliminado correctamente.');
      cargarProductos();
    } catch (error) {
      console.error('Error al eliminar espejo:', error);
      alert('No se pudo eliminar el producto.');
    }
  };

  // Filtrado dinámico por búsqueda y categoría
  const productosFiltrados = productos.filter((prod) => {
    const coincideNombre = prod.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = categoriaFiltro === 'todas' || prod.categoria === categoriaFiltro;
    return coincideNombre && coincideCategoria;
  });

  return (
    <main className="min-h-screen bg-[#FDFBF7] py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* CABECERA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
          <div>
            <span className="text-[10px] tracking-[0.3em] uppercase text-gray-500 block font-sans">
              ACOMÓDATE MUEBLES · TALLER
            </span>
            <h1 className="font-serif text-3xl text-[#1A1A1A]">Catálogo de Espejos</h1>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/admin/productos/nuevo"
              className="bg-[#1A1A1A] text-white px-5 py-3 rounded-xl text-xs uppercase tracking-widest hover:bg-[#8C6D53] transition-colors font-medium shadow-sm"
            >
              + Nuevo Mueble 
            </Link>
            <Link 
              href="/admin" 
              className="text-xs uppercase tracking-widest text-gray-600 hover:text-black font-medium transition-colors"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        {/* BARRA DE FILTROS Y BÚSQUEDA */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar espejo por nombre..."
            className="w-full md:w-80 border border-gray-200 rounded-xl p-3 text-sm text-[#1A1A1A] font-medium focus:outline-none focus:border-[#8C6D53] bg-white"
          />

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Categoría:</span>
            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="border border-gray-200 rounded-xl p-3 text-sm text-[#1A1A1A] font-medium focus:outline-none focus:border-[#8C6D53] bg-white capitalize"
            >
              <option value="todas">Todas las categorías</option>
              <option value="cuerpo-entero">Cuerpo Entero</option>
              <option value="decorativos">Decorativos</option>
              <option value="con-luz-led">Con Luz LED</option>
              <option value="pared">De Pared / Sala</option>
            </select>
          </div>
        </div>

        {/* LISTADO DE PRODUCTOS EN TABLA / TARJETAS */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {cargando ? (
            <p className="text-xs uppercase tracking-widest text-gray-400 animate-pulse text-center py-20">
              Cargando espejos de la base de datos...
            </p>
          ) : productosFiltrados.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <span className="text-4xl block">🪞</span>
              <p className="text-xs text-gray-400 uppercase tracking-widest">
                No se encontraron espejos con esta búsqueda.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {productosFiltrados.map((prod) => (
                <div key={prod.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:bg-gray-50/50 transition-colors">
                  
                  {/* FOTO E INFO BÁSICA */}
                  <div className="flex items-center gap-4">
                    <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                      {prod.imagen ? (
                        <Image src={prod.imagen} alt={prod.nombre} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300">
                          Sin Foto
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase tracking-widest text-[#8C6D53] font-semibold bg-gray-50 px-2 py-0.5 rounded-md">
                        {prod.categoria} {prod.subcategoria ? `· ${prod.subcategoria}` : ''}
                      </span>
                      <h3 className="font-serif text-lg text-[#1A1A1A] font-medium">
                        {prod.nombre}
                      </h3>
                      <p className="text-sm font-semibold text-[#1A1A1A]">
                        ${prod.precio.toLocaleString('es-CO')} COP
                      </p>
                    </div>
                  </div>

                  {/* BOTONES DE ACCIÓN */}
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                    <Link
                      href={`/admin/productos/editar/${prod.id}`}
                      className="bg-gray-100 text-[#1A1A1A] hover:bg-[#8C6D53] hover:text-white px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold transition-colors block"
                    >
                      Editar ✏️
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleEliminar(prod.id, prod.nombre)}
                      className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                    >
                      Eliminar 🗑️
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}