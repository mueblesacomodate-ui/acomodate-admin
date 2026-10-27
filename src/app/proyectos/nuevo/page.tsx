'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { db, storage } from '@/app/lib/firebase';

export default function NuevoProyectoPage() {
  const router = useRouter();

  const [titulo, setTitulo] = useState('');
  const [subtitulo, setSubtitulo] = useState('');
  const [categoria, setCategoria] = useState('Salas');
  const [descripcion, setDescripcion] = useState('');
  
  // Opción de Video
  const [tipoVideo, setTipoVideo] = useState<'url' | 'archivo'>('url');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [esBannerPrincipal, setEsBannerPrincipal] = useState(false);

  // Imágenes
  const [imagenPrincipalFile, setImagenPrincipalFile] = useState<File | null>(null);
  const [previewPrincipal, setPreviewPrincipal] = useState<string | null>(null);

  const [imagenesGaleriaFiles, setImagenesGaleriaFiles] = useState<File[]>([]);
  const [previewsGaleria, setPreviewsGaleria] = useState<string[]>([]);

  const [cargando, setCargando] = useState(false);
  const [mensajeEstado, setMensajeEstado] = useState('');

  const inputEstilo = "w-full border border-gray-200 rounded-xl p-3 text-sm text-[#1A1A1A] font-medium placeholder:text-gray-400 focus:outline-none focus:border-[#8C6D53] bg-white";

  const handlePrincipalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagenPrincipalFile(file);
      setPreviewPrincipal(URL.createObjectURL(file));
    }
  };

  const handleGaleriaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImagenesGaleriaFiles((prev) => [...prev, ...newFiles]);
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setPreviewsGaleria((prev) => [...prev, ...newPreviews]);
    }
  };

  const eliminarFotoGaleria = (index: number) => {
    setImagenesGaleriaFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewsGaleria((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imagenPrincipalFile) {
      alert('Por favor selecciona la imagen principal del proyecto.');
      return;
    }

    try {
      setCargando(true);

      // 1. Subir Imagen Principal
      setMensajeEstado('Subiendo imagen principal...');
      const mainStorageRef = ref(storage, `proyectos/principal_${Date.now()}_${imagenPrincipalFile.name}`);
      await uploadBytes(mainStorageRef, imagenPrincipalFile);
      const urlPrincipal = await getDownloadURL(mainStorageRef);

      // 2. Subir Galería de Imágenes
      const urlsGaleria: string[] = [];
      if (imagenesGaleriaFiles.length > 0) {
        setMensajeEstado(`Subiendo ${imagenesGaleriaFiles.length} fotos de galería...`);
        for (let i = 0; i < imagenesGaleriaFiles.length; i++) {
          const file = imagenesGaleriaFiles[i];
          const galStorageRef = ref(storage, `proyectos/galeria_${Date.now()}_${file.name}`);
          await uploadBytes(galStorageRef, file);
          const urlGal = await getDownloadURL(galStorageRef);
          urlsGaleria.push(urlGal);
        }
      }

      // 3. Procesar Video (si seleccionó archivo o URL)
      let finalVideoUrl = '';
      if (tipoVideo === 'url' && videoUrlInput.trim()) {
        finalVideoUrl = videoUrlInput.trim();
      } else if (tipoVideo === 'archivo' && videoFile) {
        setMensajeEstado('Subiendo archivo de video...');
        const videoStorageRef = ref(storage, `proyectos/videos/video_${Date.now()}_${videoFile.name}`);
        await uploadBytes(videoStorageRef, videoFile);
        finalVideoUrl = await getDownloadURL(videoStorageRef);
      }

      const slugGenerado = titulo.toLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]+/g, '');

      // 4. Guardar en Firestore
      setMensajeEstado('Guardando proyecto en la base de datos...');
      await addDoc(collection(db, 'proyectos'), {
        titulo: titulo.trim(),
        subtitulo: subtitulo.trim(),
        categoria,
        descripcion: descripcion.trim() || '',
        videoUrl: finalVideoUrl,
        imagen: urlPrincipal,
        imagenesGaleria: urlsGaleria,
        esBannerPrincipal,
        slug: slugGenerado,
        creadoEn: serverTimestamp(),
      });

      alert('¡Proyecto registrado con éxito!');
      router.push('/');
    } catch (error) {
      console.error('Error al guardar el proyecto:', error);
      alert('Ocurrió un error al intentar guardar el proyecto.');
    } finally {
      setCargando(false);
      setMensajeEstado('');
    }
  };

  return (
    <main className="min-h-screen bg-[#FDFBF7] py-12 px-6">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-6">
          <div>
            <span className="text-[10px] tracking-[0.3em] uppercase text-gray-500 block font-sans">
              SECCIÓN PROYECTOS ADMIN
            </span>
            <h1 className="font-serif text-3xl text-[#1A1A1A]">Nuevo Proyecto Destacado</h1>
          </div>
          <Link
            href="/"
            className="text-xs uppercase tracking-widest text-gray-600 hover:text-black font-medium transition-colors"
          >
            ← Volver al Dashboard
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-8">
          
          {/* 1. INFORMACIÓN BÁSICA */}
          <div className="space-y-6">
            <h2 className="font-serif text-lg text-[#1A1A1A] border-b border-gray-100 pb-2">
              1. Información del Proyecto
            </h2>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] mb-2 font-semibold">
                Título del Proyecto *
              </label>
              <input
                type="text"
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej. Apartamento en Bogotá"
                className={inputEstilo}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] mb-2 font-semibold">
                  Subtítulo / Muebles *
                </label>
                <input
                  type="text"
                  required
                  value={subtitulo}
                  onChange={(e) => setSubtitulo(e.target.value)}
                  placeholder="Ej. Sala completa · Diseño a medida"
                  className={inputEstilo}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] mb-2 font-semibold">
                  Categoría Filtro *
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className={inputEstilo}
                >
                  <option value="Salas">Salas</option>
                  <option value="Comedores">Comedores</option>
                  <option value="Dormitorios">Dormitorios</option>
                  <option value="Sillas y Poltronas">Sillas y Poltronas</option>
                  <option value="Proyectos completos">Proyectos completos</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. MULTIMEDIA */}
          <div className="space-y-6 pt-4 border-t border-gray-100">
            <h2 className="font-serif text-lg text-[#1A1A1A] border-b border-gray-100 pb-2">
              2. Multimedia (Imágenes y Video)
            </h2>

            {/* Foto Principal */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] mb-3 font-semibold">
                Foto Principal (Portada del Proyecto) *
              </label>

              <div className="flex items-center gap-6">
                <label className="relative flex flex-col items-center justify-center w-40 h-40 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#8C6D53] cursor-pointer transition-colors overflow-hidden flex-shrink-0">
                  {previewPrincipal ? (
                    <Image
                      src={previewPrincipal}
                      alt="Preview Principal"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <span className="text-2xl block mb-1">📷</span>
                      <span className="text-[11px] text-gray-500 font-sans uppercase tracking-wider font-medium">
                        Seleccionar
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePrincipalChange}
                    className="hidden"
                  />
                </label>

                {previewPrincipal && (
                  <button
                    type="button"
                    onClick={() => {
                      setImagenPrincipalFile(null);
                      setPreviewPrincipal(null);
                    }}
                    className="text-xs text-red-600 hover:underline uppercase tracking-wider font-semibold"
                  >
                    Cambiar foto
                  </button>
                )}
              </div>
            </div>

            {/* Galería de imágenes */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] mb-3 font-semibold">
                Galería de Imágenes Adicionales (Cuadros opcionales)
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {previewsGaleria.map((prevUrl, idx) => (
                  <div key={idx} className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-200 group bg-gray-50">
                    <Image
                      src={prevUrl}
                      alt={`Galeria ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => eliminarFotoGaleria(idx)}
                      className="absolute top-2 right-2 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <label className="flex flex-col items-center justify-center w-full h-32 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#8C6D53] cursor-pointer transition-colors">
                  <span className="text-2xl text-gray-500 mb-1">+</span>
                  <span className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">Agregar Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGaleriaChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* OPCIÓN DE VIDEO: LINK O SUBIR ARCHIVO */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
              <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] font-semibold">
                Video Opcional del Proyecto
              </label>

              <div className="flex gap-4 text-xs font-sans text-gray-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoVideo"
                    checked={tipoVideo === 'url'}
                    onChange={() => setTipoVideo('url')}
                    className="accent-[#1A1A1A]"
                  />
                  Pegar Enlace URL (YouTube/Vimeo)
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoVideo"
                    checked={tipoVideo === 'archivo'}
                    onChange={() => setTipoVideo('archivo')}
                    className="accent-[#1A1A1A]"
                  />
                  Subir Archivo de Video (.mp4 / .mov)
                </label>
              </div>

              {tipoVideo === 'url' ? (
                <input
                  type="url"
                  value={videoUrlInput}
                  onChange={(e) => setVideoUrlInput(e.target.value)}
                  placeholder="Ej. https://www.youtube.com/watch?v=..."
                  className={inputEstilo}
                />
              ) : (
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-gray-700 border border-gray-200 rounded-xl p-3 bg-white"
                />
              )}
            </div>
          </div>

          {/* 3. DESCRIPCIÓN */}
          <div className="space-y-6 pt-4 border-t border-gray-100">
            <h2 className="font-serif text-lg text-[#1A1A1A] border-b border-gray-100 pb-2">
              3. Reseña y Estado
            </h2>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] mb-2 font-semibold">
                Texto / Reseña del Proyecto *
              </label>
              <textarea
                rows={4}
                required
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Un espacio cálido y contemporáneo diseñado completamente a la medida..."
                className={inputEstilo}
              />
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <input
                type="checkbox"
                id="banner"
                checked={esBannerPrincipal}
                onChange={(e) => setEsBannerPrincipal(e.target.checked)}
                className="w-4 h-4 accent-[#1A1A1A] cursor-pointer"
              />
              <label htmlFor="banner" className="text-xs font-sans text-[#1A1A1A] font-medium cursor-pointer">
                Destacar como **Banner Principal Oscuro** en la sección de Proyectos.
              </label>
            </div>
          </div>

          {mensajeEstado && (
            <p className="text-xs font-semibold text-[#8C6D53] bg-[#FDFBF7] p-3 rounded-xl border border-gray-200 text-center animate-pulse">
              ⏳ {mensajeEstado}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-[#1A1A1A] text-white hover:bg-[#8C6D53] transition-colors py-4 rounded-xl text-xs uppercase tracking-widest font-semibold disabled:bg-gray-400 cursor-pointer shadow-sm"
          >
            {cargando ? 'Publicando Proyecto...' : 'Publicar Proyecto en la Tienda'}
          </button>
        </form>

      </div>
    </main>
  );
}