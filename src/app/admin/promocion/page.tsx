'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/app/lib/firebase';
import AdminSidebar from '@/app/components/AdminSidebar';

interface PromocionForm {
  activo: boolean;
  badge: string;
  titulo: string;
  subtitulo: string;
  descripcion: string;
  precioActual: number | string;
  precioAnterior: number | string;
  ahorro: string;
  imagen: string;
  link: string;
}

interface ProductoItem {
  id: string;
  nombre: string;
}

export default function AdminPromocionPage() {
  const [form, setForm] = useState<PromocionForm>({
    activo: false,
    badge: '-30% • OFERTA DEL MES',
    titulo: '',
    subtitulo: 'NUEVA PROMO',
    descripcion: '',
    precioActual: '',
    precioAnterior: '',
    ahorro: '',
    imagen: '',
    link: '',
  });

  const [productos, setProductos] = useState<ProductoItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [procesandoImagen, setProcesandoImagen] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    async function cargarDatosIniciales() {
      try {
        setCargando(true);

        // 1. Cargar la configuración de la promoción actual
        const promoRef = doc(db, 'configuracion', 'promocion');
        const promoSnap = await getDoc(promoRef);
        if (promoSnap.exists()) {
          setForm(promoSnap.data() as PromocionForm);
        }

        // 2. Cargar la lista de productos de Firestore para el selector de enlace
        const productosSnapshot = await getDocs(collection(db, 'productos'));
        const listaProd: ProductoItem[] = [];
        productosSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          listaProd.push({
            id: docSnap.id,
            nombre: data.nombre || 'Sin nombre',
          });
        });
        setProductos(listaProd);

      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
      } finally {
        setCargando(false);
      }
    }

    cargarDatosIniciales();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Manejador específico para cuando seleccionan un producto del desplegable
  const handleSeleccionarProducto = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productoId = e.target.value;
    if (productoId) {
      setForm((prev) => ({
        ...prev,
        link: `/producto/${productoId}`
      }));
    } else {
      setForm((prev) => ({ ...prev, link: '' }));
    }
  };

  // Función para comprimir y convertir imagen a WebP en el navegador
  const handleImagenSeleccionada = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    setProcesandoImagen(true);
    setMensaje(null);

    const lector = new FileReader();
    lector.onload = (evento) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let ancho = img.width;
        let alto = img.height;

        const anchoMaximo = 1200;
        if (ancho > anchoMaximo) {
          alto = Math.round((alto * anchoMaximo) / ancho);
          ancho = anchoMaximo;
        }

        canvas.width = ancho;
        canvas.height = alto;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setProcesandoImagen(false);
          return;
        }

        ctx.drawImage(img, 0, 0, ancho, alto);

        // Convertir a WebP con calidad 85%
        const dataUrlWebp = canvas.toDataURL('image/webp', 0.85);
        
        setForm((prev) => ({ ...prev, imagen: dataUrlWebp }));
        setProcesandoImagen(false);
        setMensaje({ tipo: 'exito', texto: '¡Imagen convertida a WebP exitosamente!' });
      };
      img.src = evento.target?.result as string;
    };
    lector.readAsDataURL(archivo);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);

    try {
      let urlFinalImagen = form.imagen;

      // Si la imagen es un Base64 (nueva imagen convertida), la subimos a Firebase Storage
      if (form.imagen.startsWith('data:image/webp;base64,')) {
        const nombreArchivo = `promociones/promo-${Date.now()}.webp`;
        const storageRef = ref(storage, nombreArchivo);
        
        await uploadString(storageRef, form.imagen, 'data_url');
        urlFinalImagen = await getDownloadURL(storageRef);
      }

      const docRef = doc(db, 'configuracion', 'promocion');
      await setDoc(docRef, {
        ...form,
        imagen: urlFinalImagen,
        precioActual: Number(form.precioActual) || 0,
        precioAnterior: Number(form.precioAnterior) || 0,
      }, { merge: true });

      setForm((prev) => ({ ...prev, imagen: urlFinalImagen }));
      setMensaje({ tipo: 'exito', texto: '¡Promoción guardada y publicada correctamente!' });
    } catch (error) {
      console.error('Error al guardar promoción:', error);
      setMensaje({ tipo: 'error', texto: 'Hubo un error al subir la imagen o guardar los cambios.' });
    } finally {
      setGuardando(false);
    }
  };

  // Extraer el ID actual del producto si ya viene guardado en el link
  const productoIdActual = form.link.startsWith('/producto/') ? form.link.replace('/producto/', '') : '';

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex font-sans text-[#1A1A1A]">
      
      <AdminSidebar />

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-8 md:p-12 space-y-6 overflow-y-auto">
        
        <div className="border-b border-gray-200 pb-4">
          <span className="text-[10px] tracking-[0.3em] uppercase text-gray-500 block font-sans mb-1">
            ACOMÓDATE MUEBLES · MARKETING
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-normal text-[#1A1A1A]">
            Promoción del Mes (Hero Banner)
          </h2>
          <p className="text-xs text-gray-500 font-light mt-1">
            Configura el mueble o banner promocional destacado en el inicio de la tienda.
          </p>
        </div>

        {cargando ? (
          <p className="text-xs uppercase tracking-widest text-gray-400 animate-pulse py-10">
            Cargando datos de la promoción...
          </p>
        ) : (
          <form onSubmit={handleGuardar} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm max-w-3xl space-y-6">
            
            {/* SWITCH ACTIVAR/DESACTIVAR */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <span className="font-semibold text-xs uppercase tracking-wider text-[#1A1A1A] block">Mostrar Promoción en la Home</span>
                <span className="text-[11px] text-gray-500 font-light">
                  Si lo desactivas, se mostrará el hero banner editorial predeterminado de los muebles.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="activo"
                  checked={form.activo}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A1A1A]"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* TITULO */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#1A1A1A] mb-2">
                  Título de la Oferta
                </label>
                <input
                  type="text"
                  name="titulo"
                  value={form.titulo}
                  onChange={handleChange}
                  placeholder="Ej: Sofá Seccional Nórdico"
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8C6D53]"
                />
              </div>

              {/* SUBTÍTULO / ETIQUETA SUPERIOR */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#1A1A1A] mb-2">
                  Subtítulo / Categoría
                </label>
                <input
                  type="text"
                  name="subtitulo"
                  value={form.subtitulo}
                  onChange={handleChange}
                  placeholder="Ej: Sala Destacada"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8C6D53]"
                />
              </div>

              {/* BADGE DE DESCUENTO */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#1A1A1A] mb-2">
                  Insignia / Badge
                </label>
                <input
                  type="text"
                  name="badge"
                  value={form.badge}
                  onChange={handleChange}
                  placeholder="Ej: -30% • OFERTA DEL MES"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8C6D53]"
                />
              </div>

              {/* TEXTO DE AHORRO */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#1A1A1A] mb-2">
                  Etiqueta de Ahorro
                </label>
                <input
                  type="text"
                  name="ahorro"
                  value={form.ahorro}
                  onChange={handleChange}
                  placeholder="Ej: Ahorras $450.000"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8C6D53]"
                />
              </div>

              {/* PRECIO ACTUAL */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#1A1A1A] mb-2">
                  Precio Oferta (COP)
                </label>
                <input
                  type="number"
                  name="precioActual"
                  value={form.precioActual}
                  onChange={handleChange}
                  placeholder="1450000"
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8C6D53]"
                />
              </div>

              {/* PRECIO ANTERIOR */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#1A1A1A] mb-2">
                  Precio Normal / Original (COP)
                </label>
                <input
                  type="number"
                  name="precioAnterior"
                  value={form.precioAnterior}
                  onChange={handleChange}
                  placeholder="1900000"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8C6D53]"
                />
              </div>
            </div>

            {/* DESCRIPCIÓN */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-[#1A1A1A] mb-2">
                Descripción Corta
              </label>
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                rows={3}
                placeholder="Estructura en madera nativa, tapizado en lino anti-fluidos de alta resistencia."
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8C6D53]"
              />
            </div>

            {/* CARGADOR DE IMAGEN CON CONVERSIÓN AUTOMÁTICA A WEBP */}
            <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <label className="block text-xs uppercase tracking-wider font-semibold text-[#1A1A1A]">
                Imagen Principal del Banner (Optimización WebP automática)
              </label>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImagenSeleccionada}
                  className="text-xs text-gray-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#1A1A1A] file:text-white hover:file:bg-[#8C6D53] file:cursor-pointer cursor-pointer"
                />
                {procesandoImagen && (
                  <span className="text-xs text-[#8C6D53] animate-pulse font-medium">
                    Optimizando imagen a WebP...
                  </span>
                )}
              </div>

              {form.imagen && (
                <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200 bg-black/5 mt-3">
                  <Image
                    src={form.imagen}
                    alt="Vista previa banner"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>

            {/* VINCULAR PRODUCTO AUTOMÁTICAMENTE */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-[#1A1A1A] mb-2">
                Asociar Producto de la Tienda (Genera el enlace automáticamente)
              </label>
              <select
                value={productoIdActual}
                onChange={handleSeleccionarProducto}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8C6D53] cursor-pointer"
              >
                <option value="">-- Selecciona un mueble del catálogo --</option>
                {productos.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.nombre}
                  </option>
                ))}
              </select>
              {form.link && (
                <span className="text-[11px] text-gray-400 mt-1 block font-light">
                  Enlace generado: <code className="bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded font-mono text-[#1A1A1A]">{form.link}</code>
                </span>
              )}
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
                disabled={guardando || procesandoImagen}
                className="bg-[#1A1A1A] text-white px-8 py-3.5 rounded-xl text-xs uppercase tracking-widest font-semibold hover:bg-[#8C6D53] transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {guardando ? 'Guardando...' : 'Guardar Promoción'}
              </button>
            </div>
          </form>
        )}
      </main>

    </div>
  );
}