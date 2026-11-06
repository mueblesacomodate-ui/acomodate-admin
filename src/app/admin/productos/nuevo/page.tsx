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

export default function NuevoProductoPage() {
  const router = useRouter();
  
  // 1. Campos Básicos y Categorías Múltiples
  const [nombre, setNombre] = useState('');
  const [categorias, setCategorias] = useState<string[]>(['salas']);
  const [subcategoria, setSubcategoria] = useState('');
  const [precio, setPrecio] = useState('');
  const [descripcion, setDescripcion] = useState('');

  // 2. Medidas y Especificaciones de Muebles (Estructura, Tapiz, Patas)
  const [alto, setAlto] = useState('');
  const [ancho, setAncho] = useState('');
  const [profundidad, setProfundidad] = useState('');
  const [estructura, setEstructura] = useState('');
  const [tapiz, setTapiz] = useState('');
  const [patas, setPatas] = useState('');

  // 3. Información Editorial Estilo Taller Artesanal
  const [composicionDelantera, setComposicionDelantera] = useState('100% Madera sólida de roble y tapiz lino premium');
  const [composicionTrasera, setComposicionTrasera] = useState('100% Maderas reforzadas y herrajes de alta resistencia');
  const [origen, setOrigen] = useState('Hecho en Taller (Acomódate Muebles)');
  const [peso, setPeso] = useState('25.00 kg');
  const [politicaEnvio, setPoliticaEnvio] = useState(
    'ENVÍO TALLER: 45.000 COP a perímetro urbano. Incluye instalación y armado en sitio. (Gratis para compras superiores a 1.500.000 COP).'
  );
  const [disponibilidadTienda, setDisponibilidadTienda] = useState(
    'Fabricación bajo pedido o stock disponible en showroom principal.'
  );

  // 4. Archivos de Imagen y Previsualizaciones
  const [imagenPrincipalFile, setImagenPrincipalFile] = useState<File | null>(null);
  const [previewPrincipal, setPreviewPrincipal] = useState<string | null>(null);

  const [imagenesAmbientesFiles, setImagenesAmbientesFiles] = useState<File[]>([]);
  const [previewsAmbientes, setPreviewsAmbientes] = useState<string[]>([]);

  const [cargando, setCargando] = useState(false);
  const [mensajeEstado, setMensajeEstado] = useState('');

  const inputEstilo = "w-full border border-gray-200 rounded-xl p-3 text-sm text-[#1A1A1A] font-medium placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-[#8C6D53] bg-white";
  const inputPequenoEstilo = "w-full border border-gray-200 rounded-lg p-2.5 text-sm text-[#1A1A1A] font-medium placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-[#8C6D53] bg-white";

  // Manejador para toggle de categorías múltiples
  const toggleCategoria = (catId: string) => {
    setCategorias((prev) => {
      if (prev.includes(catId)) {
        if (prev.length === 1) return prev; // Mantener al menos una
        return prev.filter((item) => item !== catId);
      }
      return [...prev, catId];
    });
  };

  // Actualizar subcategorías en base a la primera categoría seleccionada
  useEffect(() => {
    const primeraCat = categorias[0] || 'salas';
    const subs = subcategoriasPorCategoria[primeraCat] || [];
    setSubcategoria(subs[0] || '');
  }, [categorias]);

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

        setImagenesAmbientesFiles((prev) => [...prev, ...convertidos]);
        const newPreviews = convertidos.map((file) => URL.createObjectURL(file));
        setPreviewsAmbientes((prev) => [...prev, ...newPreviews]);
      } catch (error) {
        console.error('Error al convertir fotos de ambiente:', error);
      } finally {
        setMensajeEstado('');
      }
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
      setMensajeEstado('Subiendo foto principal en WebP...');

      const mainStorageRef = ref(storage, `muebles/principal_${Date.now()}_${imagenPrincipalFile.name}`);
      await uploadBytes(mainStorageRef, imagenPrincipalFile);
      const urlPrincipal = await getDownloadURL(mainStorageRef);

      const urlsAmbientes: string[] = [];
      if (imagenesAmbientesFiles.length > 0) {
        setMensajeEstado(`Subiendo ${imagenesAmbientesFiles.length} fotos de galería en WebP...`);
        for (let i = 0; i < imagenesAmbientesFiles.length; i++) {
          const file = imagenesAmbientesFiles[i];
          const ambStorageRef = ref(storage, `muebles/ambientes_${Date.now()}_${file.name}`);
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

      setMensajeEstado('Guardando mueble en el catálogo...');
      await addDoc(collection(db, 'productos'), {
        nombre: nombre.trim(),
        categorias: categorias, // Array de categorías múltiples
        categoria: categorias[0] || 'salas', // Campo base por compatibilidad
        subcategoria: subcategoria.trim(),
        precio: Number(precio),
        descripcion: descripcion.trim() || '',
        medidas: objetoMedidas,
        materiales: objetoMateriales,
        editorial: objetoEditorial,
        imagen: urlPrincipal,
        imagenes: urlsAmbientes.length > 0 ? urlsAmbientes : [urlPrincipal],
        creadoEn: serverTimestamp(),
      });

      alert('¡Mueble publicado con éxito en la colección!');
      router.push('/admin/productos');
    } catch (error) {
      console.error('Error al guardar el mueble:', error);
      alert('Ocurrió un error al intentar guardar el mueble.');
    } finally {
      setCargando(false);
      setMensajeEstado('');
    }
  };

  return (
    <main className="min-h-screen bg-[#FDFBF7] py-12 px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* CABECERA */}
        <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-6">
          <div>
            <span className="text-[10px] tracking-[0.3em] uppercase text-gray-500 block font-sans">
              ACOMÓDATE MUEBLES · TALLER
            </span>
            <h1 className="font-serif text-3xl text-[#1A1A1A]">Agregar Nuevo Mueble</h1>
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
                  placeholder="Ej. Sofá Seccional Nórdico 3 Puestos"
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
                  placeholder="Ej. 1890000"
                  className={inputEstilo}
                />
              </div>
            </div>

            {/* SELECCIÓN MÚLTIPLE DE CATEGORÍAS */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] mb-2 font-semibold">
                Categorías (Puedes seleccionar una o varias) *
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
                Foto Principal (Portada del catálogo) *
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

                {previewPrincipal && (
                  <button
                    type="button"
                    onClick={() => {
                      setImagenPrincipalFile(null);
                      setPreviewPrincipal(null);
                    }}
                    className="text-xs text-red-600 hover:underline uppercase tracking-wider font-semibold cursor-pointer"
                  >
                    Cambiar foto
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] mb-3 font-semibold">
                Galería de Ambientes (Imágenes adicionales)
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {previewsAmbientes.map((prevUrl, idx) => (
                  <div key={idx} className="relative w-full h-36 rounded-xl overflow-hidden border border-gray-200 group bg-gray-50">
                    <Image
                      src={prevUrl}
                      alt={`Ambiente ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => eliminarFotoAmbiente(idx)}
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

          {/* 3. DETALLES Y ESPECIFICACIONES TÉCNICAS */}
          <div className="space-y-6 pt-4 border-t border-gray-100">
            <h2 className="font-serif text-lg text-[#1A1A1A] border-b border-gray-100 pb-2">
              3. Especificaciones Técnicas y Medidas
            </h2>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] mb-2 font-semibold">
                Descripción Editorial
              </label>
              <textarea
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Mueble fabricado artesanalmente con estructura de madera nativa seleccionada..."
                className={inputEstilo}
              />
            </div>

            {/* Medidas */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-4">
              <h3 className="text-xs uppercase tracking-widest text-[#1A1A1A] font-bold">
                Dimensiones Generales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] text-gray-500 font-medium mb-1">Alto</label>
                  <input
                    type="text"
                    value={alto}
                    onChange={(e) => setAlto(e.target.value)}
                    placeholder="Ej. 85 cm"
                    className={inputPequenoEstilo}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 font-medium mb-1">Ancho / Frente</label>
                  <input
                    type="text"
                    value={ancho}
                    onChange={(e) => setAncho(e.target.value)}
                    placeholder="Ej. 210 cm"
                    className={inputPequenoEstilo}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 font-medium mb-1">Profundidad / Fondo</label>
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
                    placeholder="Ej. Madera de pino inmune y secada"
                    className={inputPequenoEstilo}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 font-medium mb-1">Tapizado / Tela</label>
                  <input
                    type="text"
                    value={tapiz}
                    onChange={(e) => setTapiz(e.target.value)}
                    placeholder="Ej. Lino anti-fluidos o Terciopelo"
                    className={inputPequenoEstilo}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 font-medium mb-1">Patas / Herrajes</label>
                  <input
                    type="text"
                    value={patas}
                    onChange={(e) => setPatas(e.target.value)}
                    placeholder="Ej. Madera roble natural o metálicas negras"
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
            {cargando ? 'Guardando Mueble...' : 'Publicar Mueble en la Colección'}
          </button>
        </form>

      </div>
    </main>
  );
}