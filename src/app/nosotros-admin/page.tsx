'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Link from 'next/link';
import Image from 'next/image';
import { db, storage } from '../lib/firebase';

const HISTORIA_INICIAL = `Detrás de Acomódate Muebles hay una historia de amor, sueños y perseverancia. Somos Winny Ríos y Cristian Rodríguez, una pareja que decidió construir no solo una empresa, sino también un futuro juntos.

En 2020 nació Acomódate Muebles en redes sociales, con muchas ganas de salir adelante y el sueño de crear algo propio. Con esfuerzo, dedication y amor por lo que hacemos, fuimos convirtiendo aquella idea en una realidad.

En 2023 dimos un gran paso: abrimos nuestra sala de exhibición en el sector del 12 de Octubre, en Bogotá. Así, nuestro sueño comenzó a crecer y a llegar a más hogares.

En este camino, las redes sociales y las colaboraciones han sido fundamentales. Westcol, streamer colombiano, fue una de las primeras figuras reconocidas en brindarnos una oportunidad que impulsó nuestra visibilidad. Su segunda colaboración con nosotros hizo aún más especial esta experiencia.

También hemos compartido momentos con participantes del Desafío, Kelly Ríos “Guajira”, Kevyn Rua, Karoline, Valentina Rodríguez y Alejandro Estrada, personas que han formado parte de nuestro crecimiento y nos han ayudado a llevar nuestra marca más lejos.

Pero detrás de cada logro hay mucho más que muebles: hay trabajo en equipo, aprendizajes, retos y dos personas que siguen creyendo en el mismo sueño. Después de seis años juntos, continuamos construyendo una historia en la que el amor y el emprendimiento van de la mano.

Hoy, Acomódate Muebles representa todo lo que hemos creado juntos y la ilusión de seguir transformando hogares. Porque antes de ser una marca, fuimos dos personas que se atrevieron a soñar.

Somos Winny y Cristian. Somos amor, esfuerzo y sueños compartidos. Somos Acomódate Muebles. 🤍

Y esto apenas comienza… ✨`;

const IMAGEN_DEFAULT = "https://firebasestorage.googleapis.com/v0/b/acomodate-muebles.firebasestorage.app/o/productos%2Fprincipal_1793027796308_Captura%20de%20pantalla%202026-10-06%20a%20la(s)%2010.25.55%E2%80%AFp.m..png?alt=media&token=c827f9ba-97bb-425a-a481-40d3bffa03d3";

export default function AdminNosotrosPage() {
  const [titulo, setTitulo] = useState('Nuestra Historia 🤍');
  const [subtitulo, setSubtitulo] = useState('Acomódate Muebles');
  const [historiaTexto, setHistoriaTexto] = useState(HISTORIA_INICIAL);
  const [imagenUrl, setImagenUrl] = useState(IMAGEN_DEFAULT);
  const [nuevaImagenFile, setNuevaImagenFile] = useState<File | null>(null);
  
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const inputEstilo = "w-full border border-gray-200 rounded-xl p-3 text-sm text-[#1A1A1A] font-medium focus:outline-none focus:border-[#8C6D53] bg-white";

  useEffect(() => {
    async function cargarHistoria() {
      try {
        const docRef = doc(db, 'contenido_sitio', 'nosotros');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTitulo(data.titulo || 'Nuestra Historia 🤍');
          setSubtitulo(data.subtitulo || 'Acomódate Muebles');
          setHistoriaTexto(data.historiaTexto || HISTORIA_INICIAL);
          setImagenUrl(data.imagenUrl || IMAGEN_DEFAULT);
        }
      } catch (error) {
        console.error('Error al cargar la historia:', error);
      } finally {
        setCargando(false);
      }
    }
    cargarHistoria();
  }, []);

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGuardando(true);
      let finalImagenUrl = imagenUrl;

      // Si seleccionó una nueva imagen, la subimos a Firebase Storage
      if (nuevaImagenFile) {
        const storageRef = ref(storage, `nosotros/nosotros_${Date.now()}_${nuevaImagenFile.name}`);
        await uploadBytes(storageRef, nuevaImagenFile);
        finalImagenUrl = await getDownloadURL(storageRef);
      }

      const docRef = doc(db, 'contenido_sitio', 'nosotros');
      await setDoc(docRef, {
        titulo,
        subtitulo,
        historiaTexto,
        imagenUrl: finalImagenUrl,
        actualizadoEn: serverTimestamp(),
      });

      setImagenUrl(finalImagenUrl);
      setNuevaImagenFile(null);
      alert('¡Historia e imagen actualizadas con éxito!');
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Ocurrió un error al guardar los cambios.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FDFBF7] py-12 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between border-b border-gray-200 pb-6">
          <div>
            <span className="text-[10px] tracking-[0.3em] uppercase text-gray-500 block font-sans">
              GESTIÓN DE CONTENIDO
            </span>
            <h1 className="font-serif text-3xl text-[#1A1A1A]">Editar Sección "Nosotros"</h1>
          </div>
          <Link href="/" className="text-xs uppercase tracking-widest text-gray-600 hover:text-black font-medium transition-colors">
            ← Volver al Dashboard
          </Link>
        </div>

        {cargando ? (
          <p className="text-xs uppercase tracking-widest text-gray-400 animate-pulse text-center py-20">Cargando datos...</p>
        ) : (
          <form onSubmit={handleGuardar} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] mb-2 font-semibold">Título Principal</label>
              <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} className={inputEstilo} required />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] mb-2 font-semibold">Subtítulo / Marca</label>
              <input type="text" value={subtitulo} onChange={(e) => setSubtitulo(e.target.value)} className={inputEstilo} required />
            </div>

            {/* GESTIÓN DE LA IMAGEN */}
            <div className="space-y-3">
              <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] font-semibold">Imagen Principal de la Historia</label>
              
              <div className="relative h-48 w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                <Image 
                  src={nuevaImagenFile ? URL.createObjectURL(nuevaImagenFile) : imagenUrl} 
                  alt="Vista previa" 
                  fill 
                  className="object-cover" 
                />
              </div>

              <div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setNuevaImagenFile(e.target.files?.[0] || null)} 
                  className="w-full text-xs text-gray-500 border border-gray-200 rounded-xl p-3 bg-white"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Sube una nueva foto si deseas reemplazar la actual.</span>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] mb-2 font-semibold">
                Texto de la Historia
              </label>
              <textarea 
                rows={14} 
                value={historiaTexto} 
                onChange={(e) => setHistoriaTexto(e.target.value)} 
                className={inputEstilo} 
                required 
              />
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="w-full bg-[#1A1A1A] text-white hover:bg-[#8C6D53] transition-colors py-4 rounded-xl text-xs uppercase tracking-widest font-semibold cursor-pointer shadow-sm disabled:bg-gray-400"
            >
              {guardando ? 'Guardando cambios...' : 'Guardar y Publicar Cambios →'}
            </button>
          </form>
        )}

      </div>
    </main>
  );
}