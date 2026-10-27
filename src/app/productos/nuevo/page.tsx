'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { db, storage } from '@/app/lib/firebase';

const subcategoriasPorCategoria: Record<string, string[]> = {
  salas: [
    'Sofás',
    'Salas en L',
    'Sofá Camas',
    'Reclinables',
    'Sillones y Poltronas',
    'Puff',
    'Mesas de Centro',
    'Mesas Auxiliares',
    'Aparadores',
    'Consolas',
    'Módulos Flotantes'
  ],
  comedores: ['Mesas de Comedor', 'Sillas de Comedor', 'Bifes y Vitrinas'],
  dormitorios: ['Camas', 'Nocheros', 'Clósets', 'Tocadores'],
  sillas: ['Poltronas', 'Sillas de Oficina', 'Bancos y Bar']
};

export default function NuevoProductoPage() {
  const router = useRouter();
  
  // Campos básicos
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('salas');
  const [subcategoria, setSubcategoria] = useState('');
  const [precio, setPrecio] = useState('');
  const [descripcion, setDescripcion] = useState('');

  // Medidas y Materiales
  const [alto, setAlto] = useState('');
  const [ancho, setAncho] = useState('');
  const [profundidad, setProfundidad] = useState('');
  const [estructura, setEstructura] = useState('');
  const [tapiz, setTapiz] = useState('');
  const [patas, setPatas] = useState('');

  // Archivos de imagen
  const [imagenPrincipalFile, setImagenPrincipalFile] = useState<File | null>(null);
  const [previewPrincipal, setPreviewPrincipal] = useState<string | null>(null);

  const [imagenesAmbientesFiles, setImagenesAmbientesFiles] = useState<File[]>([]);
  const [previewsAmbientes, setPreviewsAmbientes] = useState<string[]>([]);

  const [cargando, setCargando] = useState(false);
  const [mensajeEstado, setMensajeEstado] = useState('');

  // Clase común para asegurarnos de que el texto escrito por el usuario sea SIEMPRE negro puro
  const inputEstilo = "w-full border border-gray-200 rounded-xl p-3 text-sm text-[#1A1A1A] font-medium placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-[#8C6D53] bg-white";
  const inputPequenoEstilo = "w-full border border-gray-200 rounded-lg p-2.5 text-sm text-[#1A1A1A] font-medium placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-[#8C6D53] bg-white";

  useEffect(() => {
    const subs = subcategoriasPorCategoria[categoria] || [];
    setSubcategoria(subs[0] || '');
  }, [categoria]);

  const handlePrincipalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagenPrincipalFile(file);
      setPreviewPrincipal(URL.createObjectURL(file));
    }
  };

  const handleAmbientesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImagenesAmbientesFiles((prev) => [...prev, ...newFiles]);
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setPreviewsAmbientes((prev) => [...prev, ...newPreviews]);
    }
  };

  const eliminarFotoAmbiente = (index: number) => {
    setImagenesAmbientesFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewsAmbientes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imagenPrincipalFile) {
      alert('Por favor selecciona la imagen principal del mueble.');
      return;
    }

    if (!subcategoria) {
      alert('Por favor selecciona una subcategoría.');
      return;
    }

    try {
      setCargando(true);
      setMensajeEstado('Subiendo foto principal...');

      const mainStorageRef = ref(storage, `productos/principal_${Date.now()}_${imagenPrincipalFile.name}`);
      await uploadBytes(mainStorageRef, imagenPrincipalFile);
      const urlPrincipal = await getDownloadURL(mainStorageRef);

      const urlsAmbientes: string[] = [];
      if (imagenesAmbientesFiles.length > 0) {
        setMensajeEstado(`Subiendo ${imagenesAmbientesFiles.length} fotos de galería...`);
        for (let i = 0; i < imagenesAmbientesFiles.length; i++) {
          const file = imagenesAmbientesFiles[i];
          const ambStorageRef = ref(storage, `productos/ambientes_${Date.now()}_${file.name}`);
          await uploadBytes(ambStorageRef, file);
          const urlAmb = await getDownloadURL(ambStorageRef);
          urlsAmbientes.push(urlAmb);
        }
      }

      const objetoMedidas = {
        alto: alto.trim(),
        ancho: ancho.trim(),
        profundidad: profundidad.trim(),
      };

      const objetoMateriales = {
        estructura: estructura.trim(),
        tapiz: tapiz.trim(),
        patas: patas.trim(),
      };

      setMensajeEstado('Guardando producto en el catálogo...');
      await addDoc(collection(db, 'productos'), {
        nombre: nombre.trim(),
        categoria: categoria.toLowerCase(),
        subcategoria: subcategoria.trim(),
        precio: Number(precio),
        descripcion: descripcion.trim() || '',
        medidas: objetoMedidas,
        materiales: objetoMateriales,
        imagen: urlPrincipal,
        imagenes: urlsAmbientes.length > 0 ? urlsAmbientes : [urlPrincipal],
        creadoEn: serverTimestamp(),
      });

      alert('¡Mueble publicado con éxito en la tienda!');
      router.push('/');
    } catch (error) {
      console.error('Error al guardar el producto:', error);
      alert('Ocurrió un error al intentar guardar el producto.');
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
              CATÁLOGO ADMIN
            </span>
            <h1 className="font-serif text-3xl text-[#1A1A1A]">Agregar Nuevo Mueble</h1>
          </div>
          <Link
            href="/"
            className="text-xs uppercase tracking-widest text-gray-600 hover:text-black font-medium transition-colors"
          >
            ← Volver al Dashboard
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-8">
          
          {/* 1. INFORMACIÓN PRINCIPAL */}
          <div className="space-y-6">
            <h2 className="font-serif text-lg text-[#1A1A1A] border-b border-gray-100 pb-2">
              1. Información Principal
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] mb-2 font-semibold">
                  Nombre del Mueble *
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Sofá Tonic"
                  className={inputEstilo}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] mb-2 font-semibold">
                  Precio ($) *
                </label>
                <input
                  type="number"
                  required
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  placeholder="Ej. 3500000"
                  className={inputEstilo}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] mb-2 font-semibold">
                  Categoría Principal *
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className={`${inputEstilo} capitalize`}
                >
                  <option value="salas">Salas</option>
                  <option value="comedores">Comedores</option>
                  <option value="dormitorios">Dormitorios</option>
                  <option value="sillas">Sillas y Poltronas</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] mb-2 font-semibold">
                  Subcategoría *
                </label>
                <select
                  required
                  value={subcategoria}
                  onChange={(e) => setSubcategoria(e.target.value)}
                  className={inputEstilo}
                >
                  {(subcategoriasPorCategoria[categoria] || []).map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 2. FOTOGRAFÍA E IMÁGENES */}
          <div className="space-y-6 pt-4 border-t border-gray-100">
            <h2 className="font-serif text-lg text-[#1A1A1A] border-b border-gray-100 pb-2">
              2. Fotografía e Imágenes
            </h2>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] mb-3 font-semibold">
                Foto Principal (Portada del catálogo) *
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

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] mb-3 font-semibold">
                Galería de Ambientes (Cuadros de imágenes adicionales)
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {previewsAmbientes.map((prevUrl, idx) => (
                  <div key={idx} className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-200 group bg-gray-50">
                    <Image
                      src={prevUrl}
                      alt={`Ambiente ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => eliminarFotoAmbiente(idx)}
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
                    onChange={handleAmbientesChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* 3. DETALLES Y MEDIDAS */}
          <div className="space-y-6 pt-4 border-t border-gray-100">
            <h2 className="font-serif text-lg text-[#1A1A1A] border-b border-gray-100 pb-2">
              3. Especificaciones Técnicas
            </h2>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] mb-2 font-semibold">
                Descripción General
              </label>
              <textarea
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Un diseño atemporal pensado para espacios contemporáneos..."
                className={inputEstilo}
              />
            </div>

            {/* Medidas */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
              <h3 className="text-xs uppercase tracking-widest text-[#1A1A1A] font-bold">
                Medidas (Dimensiones)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] text-gray-700 font-medium mb-1">Alto</label>
                  <input
                    type="text"
                    value={alto}
                    onChange={(e) => setAlto(e.target.value)}
                    placeholder="Ej. 85 cm"
                    className={inputPequenoEstilo}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-700 font-medium mb-1">Ancho</label>
                  <input
                    type="text"
                    value={ancho}
                    onChange={(e) => setAncho(e.target.value)}
                    placeholder="Ej. 210 cm"
                    className={inputPequenoEstilo}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-700 font-medium mb-1">Profundidad</label>
                  <input
                    type="text"
                    value={profundidad}
                    onChange={(e) => setProfundidad(e.target.value)}
                    placeholder="Ej. 90 cm"
                    className={inputPequenoEstilo}
                  />
                </div>
              </div>
            </div>

            {/* Materiales */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
              <h3 className="text-xs uppercase tracking-widest text-[#1A1A1A] font-bold">
                Materiales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] text-gray-700 font-medium mb-1">Estructura</label>
                  <input
                    type="text"
                    value={estructura}
                    onChange={(e) => setEstructura(e.target.value)}
                    placeholder="Ej. Madera de pino inmune"
                    className={inputPequenoEstilo}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-700 font-medium mb-1">Tapiz / Tela</label>
                  <input
                    type="text"
                    value={tapiz}
                    onChange={(e) => setTapiz(e.target.value)}
                    placeholder="Ej. Lino quality anti fluidos"
                    className={inputPequenoEstilo}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-700 font-medium mb-1">Patas / Base</label>
                  <input
                    type="text"
                    value={patas}
                    onChange={(e) => setPatas(e.target.value)}
                    placeholder="Ej. Madera roble natural"
                    className={inputPequenoEstilo}
                  />
                </div>
              </div>
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
            {cargando ? 'Guardando Mueble...' : 'Publicar Mueble en la Tienda'}
          </button>
        </form>

      </div>
    </main>
  );
}