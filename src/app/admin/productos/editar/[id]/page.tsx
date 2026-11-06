'use client';

import { useState, useEffect, use } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { db, storage } from '@/app/lib/firebase';

const subcategoriasPorCategoria: Record<string, string[]> = {
  salas: [
    'Sofás y Seccionales',
    'Sillones y Poltronas',
    'Mesas de Centro y Laterales',
    'Centros de Entretenimiento'
  ],
  comedores: [
    'Mesas de Comedor',
    'Sillas de Comedor',
    'Buffets y Aparadores',
    'Vitrinas'
  ],
  dormitorios: [
    'Camas y Cabeceros',
    'Cercas de Noche y Cómodas',
    'Clósets y Roperos',
    'Bancos de Pie de Cama'
  ],
  sillas: [
    'Sillas de Escritorio',
    'Poltronas de Lectura',
    'Bancos y Taburetes',
    'Pufs Decorativos'
  ]
};

// 🛠️ Función auxiliar para convertir cualquier imagen (File) a WebP
const convertirAWebP = (file: File, calidad: number = 0.85): Promise<File> => {
  return new Promise((resolve, reject) => {
    if (file.type === 'image/webp') {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto del canvas'));
          return;
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Falló la conversión a WebP'));
              return;
            }
            const nombreSinExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            const nuevoArchivo = new File([blob], `${nombreSinExt}.webp`, {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            resolve(nuevoArchivo);
          },
          'image/webp',
          calidad
        );
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();

  // 1. Campos Básicos y Categorías Múltiples
  const [nombre, setNombre] = useState('');
  const [categorias, setCategorias] = useState<string[]>(['salas']);
  const [subcategoria, setSubcategoria] = useState('');
  const [precio, setPrecio] = useState('');
  const [descripcion, setDescripcion] = useState('');

  // 2. Medidas y Especificaciones de Muebles
  const [alto, setAlto] = useState('');
  const [ancho, setAncho] = useState('');
  const [profundidad, setProfundidad] = useState('');
  const [estructura, setEstructura] = useState('');
  const [tapiz, setTapiz] = useState('');
  const [patas, setPatas] = useState('');

  // 3. Campos estilo Taller Artesanal
  const [composicionDelantera, setComposicionDelantera] = useState('');
  const [composicionTrasera, setComposicionTrasera] = useState('');
  const [origen, setOrigen] = useState('');
  const [peso, setPeso] = useState('');
  const [politicaEnvio, setPoliticaEnvio] = useState('');
  const [disponibilidadTienda, setDisponibilidadTienda] = useState('');

  // 4. Archivos e imágenes existentes
  const [imagenPrincipalActual, setImagenPrincipalActual] = useState('');
  const [imagenPrincipalFile, setImagenPrincipalFile] = useState<File | null>(null);
  const [previewPrincipal, setPreviewPrincipal] = useState<string | null>(null);

  const [imagenesAmbientesActuales, setImagenesAmbientesActuales] = useState<string[]>([]);
  const [nuevasAmbientesFiles, setNuevasAmbientesFiles] = useState<File[]>([]);
  const [previewsNuevasAmbientes, setPreviewsNuevasAmbientes] = useState<string[]>([]);

  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [mensajeEstado, setMensajeEstado] = useState('');

  const inputEstilo = "w-full border border-gray-200 rounded-xl p-3 text-sm text-[#1A1A1A] font-medium placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-[#8C6D53] bg-white";
  const inputPequenoEstilo = "w-full border border-gray-200 rounded-lg p-2.5 text-sm text-[#1A1A1A] font-medium placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-[#8C6D53] bg-white";

  const toggleCategoria = (catId: string) => {
    setCategorias((prev) => {
      if (prev.includes(catId)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== catId);
      }
      return [...prev, catId];
    });
  };

  // Cargar datos actuales del producto desde Firestore
  useEffect(() => {
    async function obtenerProducto() {
      try {
        setCargandoDatos(true);
        const docRef = doc(db, 'productos', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setNombre(data.nombre || '');
          
          if (data.categorias && Array.isArray(data.categorias)) {
            setCategorias(data.categorias);
          } else if (data.categoria) {
            setCategorias([data.categoria]);
          }

          setSubcategoria(data.subcategoria || '');
          setPrecio(data.precio ? String(data.precio) : '');
          setDescripcion(data.descripcion || '');

          if (data.medidas) {
            setAlto(data.medidas.alto || '');
            setAncho(data.medidas.ancho || '');
            setProfundidad(data.medidas.profundidad || '');
          }

          if (data.materiales) {
            setEstructura(data.materiales.estructura || '');
            setTapiz(data.materiales.tapiz || '');
            setPatas(data.materiales.patas || '');
          }

          if (data.editorial) {
            setComposicionDelantera(data.editorial.composicion?.delantera || '');
            setComposicionTrasera(data.editorial.composicion?.trasera || '');
            setOrigen(data.editorial.origen || '');
            setPeso(data.editorial.peso || '');
            setPoliticaEnvio(data.editorial.envio || '');
            setDisponibilidadTienda(data.editorial.disponibilidad || '');
          }

          setImagenPrincipalActual(data.imagen || '');
          setPreviewPrincipal(data.imagen || '');
          setImagenesAmbientesActuales(data.imagenes || []);
        } else {
          alert('El mueble no existe.');
          router.push('/admin/productos');
        }
      } catch (error) {
        console.error('Error al cargar mueble:', error);
      } finally {
        setCargandoDatos(false);
      }
    }

    if (id) {
      obtenerProducto();
    }
  }, [id, router]);

  const handlePrincipalChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setMensajeEstado('Optimizando foto principal a WebP...');
        const archivoWebp = await convertirAWebP(file);
        setImagenPrincipalFile(archivoWebp);
        setPreviewPrincipal(URL.createObjectURL(archivoWebp));
      } catch (error) {
        console.error('Error al convertir foto principal:', error);
        setImagenPrincipalFile(file);
        setPreviewPrincipal(URL.createObjectURL(file));
      } finally {
        setMensajeEstado('');
      }
    }
  };

  const handleAmbientesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      try {
        setMensajeEstado('Optimizando fotos de galería a WebP...');
        const convertidos = await Promise.all(filesArray.map((file) => convertirAWebP(file)));

        setNuevasAmbientesFiles((prev) => [...prev, ...convertidos]);
        const newPreviews = convertidos.map((file) => URL.createObjectURL(file));
        setPreviewsNuevasAmbientes((prev) => [...prev, ...newPreviews]);
      } catch (error) {
        console.error('Error al convertir fotos de ambiente:', error);
      } finally {
        setMensajeEstado('');
      }
    }
  };

  const eliminarFotoAmbienteActual = (index: number) => {
    setImagenesAmbientesActuales((prev) => prev.filter((_, i) => i !== index));
  };

  const eliminarFotoNuevaAmbiente = (index: number) => {
    setNuevasAmbientesFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewsNuevasAmbientes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subcategoria) {
      alert('Por favor selecciona una subcategoría.');
      return;
    }

    try {
      setCargando(true);
      setMensajeEstado('Actualizando información...');

      let urlPrincipal = imagenPrincipalActual;

      if (imagenPrincipalFile) {
        setMensajeEstado('Subiendo nueva foto principal en WebP...');
        const mainStorageRef = ref(storage, `muebles/principal_${Date.now()}_${imagenPrincipalFile.name}`);
        await uploadBytes(mainStorageRef, imagenPrincipalFile);
        urlPrincipal = await getDownloadURL(mainStorageRef);
      }

      const urlsNuevasAmbientes: string[] = [];
      if (nuevasAmbientesFiles.length > 0) {
        setMensajeEstado(`Subiendo ${nuevasAmbientesFiles.length} nuevas fotos de galería en WebP...`);
        for (let i = 0; i < nuevasAmbientesFiles.length; i++) {
          const file = nuevasAmbientesFiles[i];
          const ambStorageRef = ref(storage, `muebles/ambientes_${Date.now()}_${file.name}`);
          await uploadBytes(ambStorageRef, file);
          const urlAmb = await getDownloadURL(ambStorageRef);
          urlsNuevasAmbientes.push(urlAmb);
        }
      }

      const galeriaFinal = [...imagenesAmbientesActuales, ...urlsNuevasAmbientes];

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

      const objetoEditorial = {
        composicion: {
          delantera: composicionDelantera.trim(),
          trasera: composicionTrasera.trim(),
        },
        origen: origen.trim(),
        peso: peso.trim(),
        envio: politicaEnvio.trim(),
        disponibilidad: disponibilidadTienda.trim(),
      };

      setMensajeEstado('Guardando cambios en Firestore...');
      const docRef = doc(db, 'productos', id);
      await updateDoc(docRef, {
        nombre: nombre.trim(),
        categorias: categorias,
        categoria: categorias[0] || 'salas',
        subcategoria: subcategoria.trim(),
        precio: Number(precio),
        descripcion: descripcion.trim() || '',
        medidas: objetoMedidas,
        materiales: objetoMateriales,
        editorial: objetoEditorial,
        imagen: urlPrincipal,
        imagenes: galeriaFinal.length > 0 ? galeriaFinal : [urlPrincipal],
        actualizadoEn: serverTimestamp(),
      });

      alert('¡Mueble actualizado con éxito!');
      router.push('/admin/productos');
    } catch (error) {
      console.error('Error al actualizar el mueble:', error);
      alert('Ocurrió un error al intentar actualizar el mueble.');
    } finally {
      setCargando(false);
      setMensajeEstado('');
    }
  };

  if (cargandoDatos) {
    return (
      <main className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <p className="text-xs uppercase tracking-widest text-gray-400 animate-pulse">Cargando datos del mueble...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FDFBF7] py-12 px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* CABECERA */}
        <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-6">
          <div>
            <span className="text-[10px] tracking-[0.3em] uppercase text-gray-500 block font-sans">
              ACOMÓDATE MUEBLES · TALLER
            </span>
            <h1 className="font-serif text-3xl text-[#1A1A1A]">Editar Mueble</h1>
          </div>
          <Link
            href="/admin/productos"
            className="text-xs uppercase tracking-widest text-gray-600 hover:text-[#1A1A1A] font-medium transition-colors"
          >
            ← Volver al Catálogo
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-8">
          
          {/* 1. INFORMACIÓN PRINCIPAL & CATEGORÍAS */}
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
                  className={inputEstilo}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] mb-2 font-semibold">
                  Precio ($ COP) *
                </label>
                <input
                  type="number"
                  required
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  className={inputEstilo}
                />
              </div>
            </div>

            {/* SELECCIÓN MÚLTIPLE DE CATEGORÍAS */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] mb-2 font-semibold">
                Categorías Asociadas (Puedes marcar varias) *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: 'salas', label: 'Salas' },
                  { id: 'comedores', label: 'Comedores' },
                  { id: 'dormitorios', label: 'Dormitorios' },
                  { id: 'sillas', label: 'Sillas y Poltronas' },
                ].map((cat) => {
                  const estaSeleccionado = categorias.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategoria(cat.id)}
                      className={`py-3 px-4 rounded-xl border text-xs font-medium uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer ${
                        estaSeleccionado
                          ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-[#8C6D53]'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span>{estaSeleccionado ? '✓' : '+'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SUBCATEGORÍA */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] mb-2 font-semibold">
                Subcategoría *
              </label>
              <select
                value={subcategoria}
                onChange={(e) => setSubcategoria(e.target.value)}
                className={inputEstilo}
              >
                {(subcategoriasPorCategoria[categorias[0] || 'salas'] || []).map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* 2. FOTOGRAFÍA E IMÁGENES */}
          <div className="space-y-6 pt-4 border-t border-gray-100">
            <h2 className="font-serif text-lg text-[#1A1A1A] border-b border-gray-100 pb-2">
              2. Fotografía e Imágenes (Optimización WebP Automática)
            </h2>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] mb-3 font-semibold">
                Foto Principal (Portada del catálogo)
              </label>

              <div className="flex items-center gap-6">
                <label className="relative flex flex-col items-center justify-center w-40 h-52 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#8C6D53] cursor-pointer transition-colors overflow-hidden flex-shrink-0">
                  {previewPrincipal ? (
                    <Image
                      src={previewPrincipal}
                      alt="Preview Principal"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <span className="text-2xl block mb-1">🛋️</span>
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
                <span className="text-xs text-gray-500">Sube una nueva foto solo si deseas reemplazar la portada actual.</span>
              </div>
            </div>

            {/* Galería actual + nuevas */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] mb-3 font-semibold">
                Galería de Ambientes
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {/* Fotos actuales */}
                {imagenesAmbientesActuales.map((url, idx) => (
                  <div key={`actual-${idx}`} className="relative w-full h-36 rounded-xl overflow-hidden border border-gray-200 group bg-gray-50">
                    <Image src={url} alt={`Ambiente ${idx}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => eliminarFotoAmbienteActual(idx)}
                      className="absolute top-2 right-2 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {/* Nuevas fotos */}
                {previewsNuevasAmbientes.map((prevUrl, idx) => (
                  <div key={`nueva-${idx}`} className="relative w-full h-36 rounded-xl overflow-hidden border border-[#8C6D53] group bg-gray-50">
                    <Image src={prevUrl} alt={`Nueva ${idx}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => eliminarFotoNuevaAmbiente(idx)}
                      className="absolute top-2 right-2 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <label className="flex flex-col items-center justify-center w-full h-36 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#8C6D53] cursor-pointer transition-colors">
                  <span className="text-2xl text-gray-400 mb-1">+</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Agregar Foto</span>
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
                Descripción Editorial
              </label>
              <textarea
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className={inputEstilo}
              />
            </div>

            {/* Medidas */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-4">
              <h3 className="text-xs uppercase tracking-widest text-[#1A1A1A] font-bold">
                Dimensiones (Medidas Generales)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] text-gray-500 font-medium mb-1">Alto</label>
                  <input
                    type="text"
                    value={alto}
                    onChange={(e) => setAlto(e.target.value)}
                    className={inputPequenoEstilo}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 font-medium mb-1">Ancho / Frente</label>
                  <input
                    type="text"
                    value={ancho}
                    onChange={(e) => setAncho(e.target.value)}
                    className={inputPequenoEstilo}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 font-medium mb-1">Profundidad / Fondo</label>
                  <input
                    type="text"
                    value={profundidad}
                    onChange={(e) => setProfundidad(e.target.value)}
                    className={inputPequenoEstilo}
                  />
                </div>
              </div>
            </div>

            {/* Materiales y Acabados */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-4">
              <h3 className="text-xs uppercase tracking-widest text-[#1A1A1A] font-bold">
                Estructura, Tapiz y Patas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] text-gray-500 font-medium mb-1">Estructura</label>
                  <input
                    type="text"
                    value={estructura}
                    onChange={(e) => setEstructura(e.target.value)}
                    className={inputPequenoEstilo}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 font-medium mb-1">Tapizado / Tela</label>
                  <input
                    type="text"
                    value={tapiz}
                    onChange={(e) => setTapiz(e.target.value)}
                    className={inputPequenoEstilo}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 font-medium mb-1">Patas / Herrajes</label>
                  <input
                    type="text"
                    value={patas}
                    onChange={(e) => setPatas(e.target.value)}
                    className={inputPequenoEstilo}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* 4. INFORMACIÓN EDITORIAL */}
          <div className="space-y-6 pt-4 border-t border-gray-100">
            <h2 className="font-serif text-lg text-[#1A1A1A] border-b border-gray-100 pb-2">
              4. Composición, Cuidados, Origen & Envíos
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] mb-2 font-semibold">
                  Composición Delantera
                </label>
                <input
                  type="text"
                  value={composicionDelantera}
                  onChange={(e) => setComposicionDelantera(e.target.value)}
                  className={inputEstilo}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] mb-2 font-semibold">
                  Composición Trasera / Interna
                </label>
                <input
                  type="text"
                  value={composicionTrasera}
                  onChange={(e) => setComposicionTrasera(e.target.value)}
                  className={inputEstilo}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] mb-2 font-semibold">
                  Origen de Fabricación
                </label>
                <input
                  type="text"
                  value={origen}
                  onChange={(e) => setOrigen(e.target.value)}
                  className={inputEstilo}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] mb-2 font-semibold">
                  Peso Estimado
                </label>
                <input
                  type="text"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  className={inputEstilo}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] mb-2 font-semibold">
                Información de Envío & Instalación
              </label>
              <textarea
                rows={3}
                value={politicaEnvio}
                onChange={(e) => setPoliticaEnvio(e.target.value)}
                className={inputEstilo}
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] mb-2 font-semibold">
                Disponibilidad en Taller / Tienda
              </label>
              <input
                type="text"
                value={disponibilidadTienda}
                onChange={(e) => setDisponibilidadTienda(e.target.value)}
                className={inputEstilo}
              />
            </div>
          </div>

          {mensajeEstado && (
            <p className="text-xs font-semibold text-[#8C6D53] bg-gray-50 p-3 rounded-xl border border-gray-100 text-center animate-pulse">
              ⏳ {mensajeEstado}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-[#1A1A1A] text-white hover:bg-[#8C6D53] transition-colors py-4 rounded-xl text-xs uppercase tracking-widest font-semibold disabled:bg-gray-400 cursor-pointer shadow-sm"
          >
            {cargando ? 'Actualizando Mueble...' : 'Guardar Cambios del Mueble'}
          </button>
        </form>

      </div>
    </main>
  );
}