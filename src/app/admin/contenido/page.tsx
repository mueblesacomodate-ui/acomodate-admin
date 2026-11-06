'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import AdminSidebar from '@/app/components/AdminSidebar';

interface RedesForm {
  whatsapp: string;
  instagram: string;
  facebook: string;
  tiktok: string;
}

export default function AdminContenidoPage() {
  const [form, setForm] = useState<RedesForm>({
    whatsapp: '',
    instagram: '',
    facebook: '',
    tiktok: '',
  });

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    async function cargarConfiguracion() {
      try {
        const docRef = doc(db, 'configuracion', 'redes');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setForm(docSnap.data() as RedesForm);
        }
      } catch (error) {
        console.error('Error al cargar redes:', error);
      } finally {
        setCargando(false);
      }
    }
    cargarConfiguracion();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);

    try {
      const docRef = doc(db, 'configuracion', 'redes');
      await setDoc(docRef, form, { merge: true });
      setMensaje({ tipo: 'exito', texto: '¡Enlaces y WhatsApp actualizados correctamente!' });
    } catch (error) {
      console.error('Error al guardar:', error);
      setMensaje({ tipo: 'error', texto: 'Hubo un error al guardar los cambios.' });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex font-sans text-[#1A1A1A]">
      <AdminSidebar />

      <main className="flex-1 p-8 md:p-12 space-y-6 overflow-y-auto">
        <div className="border-b border-gray-200 pb-4">
          <span className="text-[10px] tracking-[0.3em] uppercase text-gray-500 block font-sans mb-1">
            ACOMÓDATE MUEBLES · CONFIGURACIÓN
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-normal text-[#1A1A1A]">
            Contenido del Sitio (Redes y WhatsApp)
          </h2>
          <p className="text-xs text-gray-500 font-light mt-1">
            Configura los enlaces de redes sociales y el número flotante de WhatsApp de la tienda.
          </p>
        </div>

        {cargando ? (
          <p className="text-xs uppercase tracking-widest text-gray-400 animate-pulse py-10">
            Cargando configuración...
          </p>
        ) : (
          <form onSubmit={handleGuardar} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm max-w-2xl space-y-6">
            
            {/* WHATSAPP */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-[#1A1A1A] mb-2">
                Número de WhatsApp (con código de país, sin espacios ni símbolos)
              </label>
              <input
                type="text"
                name="whatsapp"
                value={form.whatsapp}
                onChange={handleChange}
                placeholder="Ej: 573001234567"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8C6D53]"
              />
              <span className="text-[11px] text-gray-400 mt-1 block font-light">
                Este número activará el botón flotante en la esquina inferior derecha de todo el sitio.
              </span>
            </div>

            {/* INSTAGRAM */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-[#1A1A1A] mb-2">
                Enlace de Instagram
              </label>
              <input
                type="url"
                name="instagram"
                value={form.instagram}
                onChange={handleChange}
                placeholder="https://instagram.com/tu_cuenta"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8C6D53]"
              />
            </div>

            {/* FACEBOOK */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-[#1A1A1A] mb-2">
                Enlace de Facebook
              </label>
              <input
                type="url"
                name="facebook"
                value={form.facebook}
                onChange={handleChange}
                placeholder="https://facebook.com/tu_pagina"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8C6D53]"
              />
            </div>

            {/* TIKTOK */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-[#1A1A1A] mb-2">
                Enlace de TikTok
              </label>
              <input
                type="url"
                name="tiktok"
                value={form.tiktok}
                onChange={handleChange}
                placeholder="https://tiktok.com/@tu_cuenta"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8C6D53]"
              />
            </div>

            {mensaje && (
              <div
                className={`p-4 rounded-xl text-xs ${
                  mensaje.tipo === 'exito'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {mensaje.texto}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={guardando}
                className="bg-[#1A1A1A] text-white px-8 py-3.5 rounded-xl text-xs uppercase tracking-widest font-semibold hover:bg-[#8C6D53] transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {guardando ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}