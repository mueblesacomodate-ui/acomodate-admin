'use client';

import Link from 'next/link';
import { useAuth } from './context/AuthContext';

export default function AdminDashboard() {
  const { user, logout, cargando } = useAuth();

  if (cargando) {
    return (
      <main className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <p className="text-xs uppercase tracking-widest text-gray-400 animate-pulse">
          Verificando sesión...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FDFBF7] py-16 px-6">
      <div className="max-w-5xl mx-auto">
        
        {/* BARRA SUPERIOR CON USUARIO Y LOGOUT */}
        <div className="flex justify-between items-center mb-12 pb-6 border-b border-gray-200">
          <div>
            <span className="text-[10px] tracking-[0.3em] uppercase text-gray-400 block font-sans">
              SESIÓN ACTIVA
            </span>
            <span className="text-xs font-medium text-gray-700">{user?.email}</span>
          </div>

          <button
            onClick={logout}
            className="text-xs uppercase tracking-wider text-red-500 hover:text-red-700 font-medium cursor-pointer"
          >
            Cerrar Sesión ↗
          </button>
        </div>

        <header className="mb-12 text-center">
          <span className="text-xs tracking-[0.3em] uppercase text-gray-400 block mb-2 font-sans">
            ACOMÓDATE MUEBLES
          </span>
          <h1 className="font-serif text-4xl text-[#1A1A1A]">Panel de Administración</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Módulo Productos (ACTUALIZADO: Lista + Agregar) */}
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-3xl mb-4 block">🛋️</span>
              <h2 className="font-serif text-2xl text-[#1A1A1A] mb-2">Gestión de Catálogo</h2>
              <p className="text-xs text-gray-500 font-light mb-6">
                Consulta, edita o elimina los muebles publicados. Modifica precios, imágenes, especificaciones técnicas o agrega nuevas piezas al catálogo.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/productos"
                className="flex-1 bg-[#1A1A1A] text-white text-center py-3.5 rounded-xl text-xs uppercase tracking-widest hover:bg-[#8C6D53] transition-colors block font-medium"
              >
                Ver Catálogo
              </Link>
              <Link
                href="/productos/nuevo"
                className="border border-[#1A1A1A] text-[#1A1A1A] text-center py-3.5 px-4 rounded-xl text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors block font-medium"
              >
                + Nuevo
              </Link>
            </div>
          </div>

          {/* Módulo Proyectos */}
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-3xl mb-4 block">🏡</span>
              <h2 className="font-serif text-2xl text-[#1A1A1A] mb-2">Proyectos Destacados</h2>
              <p className="text-xs text-gray-500 font-light mb-6">
                Publica casos de éxito de proyectos de diseño de interiores, casas reales remodeladas y configura los banners oscuros destacados.
              </p>
            </div>
            <Link
              href="/proyectos/nuevo"
              className="w-full bg-[#1A1A1A] text-white text-center py-3.5 rounded-xl text-xs uppercase tracking-widest hover:bg-[#8C6D53] transition-colors block font-medium"
            >
              + Agregar Proyecto
            </Link>
          </div>

          {/* Módulo A medida */}
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-3xl mb-4 block">📐</span>
              <h2 className="font-serif text-2xl text-[#1A1A1A] mb-2">A medida</h2>
              <p className="text-xs text-gray-500 font-light mb-6">
                Revisa las cotizaciones y proyectos a medida que los clientes han solicitado desde el configurador.
              </p>
            </div>
            <Link
              href="/cotizaciones"
              className="w-full bg-[#1A1A1A] text-white text-center py-3.5 rounded-xl text-xs uppercase tracking-widest hover:bg-[#8C6D53] transition-colors block font-medium"
            >
              Ver Cotizaciones
            </Link>
          </div>

          {/* Módulo Materiales */}
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-3xl mb-4 block">🪵</span>
              <h2 className="font-serif text-2xl text-[#1A1A1A] mb-2">Muestras de Materiales</h2>
              <p className="text-xs text-gray-500 font-light mb-6">
                Administra la lista de maderas, micas, telas y acabados nobles que se muestran en el apartado A Tu Medida.
              </p>
            </div>
            <Link
              href="/materiales"
              className="w-full bg-[#1A1A1A] text-white text-center py-3.5 rounded-xl text-xs uppercase tracking-widest hover:bg-[#8C6D53] transition-colors block font-medium"
            >
              Gestionar Materiales
            </Link>
          </div>

          {/* Módulo Configurador "A Tu Medida" */}
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-3xl mb-4 block">⚙️</span>
              <h2 className="font-serif text-2xl text-[#1A1A1A] mb-2">Configurador "A Tu Medida"</h2>
              <p className="text-xs text-gray-500 font-light mb-6">
                Administra los tipos de muebles, imágenes, estilos y tipos de patas/costuras que aparecen en el wizard interactivo.
              </p>
            </div>
            <Link 
              href="/configurador" 
              className="w-full bg-[#1A1A1A] text-white text-center py-3.5 rounded-xl text-xs uppercase tracking-widest hover:bg-[#8C6D53] transition-colors block font-medium"
            >
              Gestionar Opciones
            </Link>
          </div>

          {/* Módulo Sección Nosotros / Historia */}
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-3xl mb-4 block">🤍</span>
              <h2 className="font-serif text-2xl text-[#1A1A1A] mb-2">Sección "Nosotros"</h2>
              <p className="text-xs text-gray-500 font-light mb-6">
                Edita el texto de la historia de Winny y Cristian, el título principal y la narración sobre Acomódate Muebles que ven tus clientes en la web.
              </p>
            </div>
            <Link
              href="/nosotros-admin"
              className="w-full bg-[#1A1A1A] text-white text-center py-3.5 rounded-xl text-xs uppercase tracking-widest hover:bg-[#8C6D53] transition-colors block font-medium"
            >
              Editar Historia
            </Link>
          </div>

        </div>

      </div>
    </main>
  );
}