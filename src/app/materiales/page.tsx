'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Link from 'next/link';
import Image from 'next/image';
import { db, storage } from '../lib/firebase';

interface Material {
  id: string;
  nombre: string;
  categoria: string;
  imagen: string;
}

export default function GestionMaterialesPage() {
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [cargando, setCargando] = useState(true);

  // Campos para nuevo/editar
  const [idEditando, setIdEditando] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('');
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [previewImagen, setPreviewImagen] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const inputEstilo = "w-full border border-gray-200 rounded-xl p-3 text-sm text-[#1A1A1A] font-medium placeholder:text-gray-400 focus:outline-none focus:border-[#8C6D53] bg-white";

  async function cargarMateriales() {
    try {
      setCargando(true);
      const querySnapshot = await getDocs(collection(db, 'materiales'));
      const lista: Material[] = [];
      querySnapshot.forEach((docSnap) => {
        lista.push({ id: docSnap.id, ...docSnap.data() } as Material);
      });
      setMateriales(lista);
    } catch (error) {
      console.error('Error al cargar materiales:', error);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarMateriales();
  }, []);

  const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagenFile(file);
      setPreviewImagen(URL.createObjectURL(file));
    }
  };

  const resetFormulario = () => {
    setIdEditando(null);
    setNombre('');
    setCategoria('');
    setImagenFile(null);
    setPreviewImagen(null);
  };

  const prepararEdicion = (mat: Material) => {
    setIdEditando(mat.id);
    setNombre(mat.nombre);
    setCategoria(mat.categoria);
    setPreviewImagen(mat.imagen);
    setImagenFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!idEditando && !imagenFile) {
      alert('Por favor selecciona una foto para el nuevo material.');
      return;
    }

    try {
      setGuardando(true);
      let urlImagen = previewImagen || '';

      // Si seleccionó un nuevo archivo, subirlo a Firebase Storage
      if (imagenFile) {
        const storageRef = ref(storage, `materiales/mat_${Date.now()}_${imagenFile.name}`);
        await uploadBytes(storageRef, imagenFile);
        urlImagen = await getDownloadURL(storageRef);
      }

      if (idEditando) {
        // Actualizar material existente
        const docRef = doc(db, 'materiales', idEditando);
        await updateDoc(docRef, {
          nombre: nombre.trim(),
          categoria: categoria.trim(),
          imagen: urlImagen,
        });
        alert('¡Material actualizado con éxito!');
      } else {
        // Crear nuevo material
        await addDoc(collection(db, 'materiales'), {
          nombre: nombre.trim(),
          categoria: categoria.trim(),
          imagen: urlImagen,
          creadoEn: serverTimestamp(),
        });
        alert('¡Material agregado con éxito!');
      }

      resetFormulario();
      cargarMateriales();
    } catch (error) {
      console.error('Error al guardar material:', error);
      alert('Ocurrió un error al intentar guardar el material.');
    } finally {
      setGuardando(false);
    }
  };

  const eliminarMaterial = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este material?')) return;

    try {
      await deleteDoc(doc(db, 'materiales', id));
      setMateriales((prev) => prev.filter((item) => item.id !== id));
      alert('Material eliminado.');
    } catch (error) {
      console.error('Error al eliminar material:', error);
      alert('No se pudo eliminar el material.');
    }
  };

  return (
    <main className="min-h-screen bg-[#FDFBF7] py-12 px-6">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-6">
          <div>
            <span className="text-[10px] tracking-[0.3em] uppercase text-gray-500 block font-sans">
              CATÁLOGO DE ACABADOS
            </span>
            <h1 className="font-serif text-3xl text-[#1A1A1A]">Gestión de Materiales</h1>
          </div>
          <Link
            href="/"
            className="text-xs uppercase tracking-widest text-gray-600 hover:text-black font-medium transition-colors"
          >
            ← Volver al Dashboard
          </Link>
        </div>

        {/* Formulario de Agregar / Editar */}
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <h2 className="font-serif text-xl text-[#1A1A1A]">
              {idEditando ? '✏️ Editar Material' : '➕ Agregar Nuevo Material'}
            </h2>
            {idEditando && (
              <button
                type="button"
                onClick={resetFormulario}
                className="text-xs text-red-500 hover:underline uppercase tracking-wider font-semibold"
              >
                Cancelar Edición
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] mb-2 font-semibold">
                  Nombre del Material *
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Roble Secado en Horno"
                  className={inputEstilo}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] mb-2 font-semibold">
                  Categoría / Tipo *
                </label>
                <input
                  type="text"
                  required
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  placeholder="Ej. Madera Natural, Textiles, Mármol"
                  className={inputEstilo}
                />
              </div>
            </div>

            {/* Foto del Material */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#1A1A1A] mb-3 font-semibold">
                Fotografía del Material *
              </label>

              <div className="flex items-center gap-6">
                <label className="relative flex flex-col items-center justify-center w-32 h-32 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#8C6D53] cursor-pointer transition-colors overflow-hidden flex-shrink-0">
                  {previewImagen ? (
                    <Image
                      src={previewImagen}
                      alt="Preview Material"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="text-center p-3">
                      <span className="text-xl block mb-1">🪵</span>
                      <span className="text-[10px] text-gray-500 font-sans uppercase tracking-wider font-medium">
                        Subir Foto
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImagenChange}
                    className="hidden"
                  />
                </label>

                {previewImagen && (
                  <span className="text-xs text-gray-500">
                    Muestra previa de la textura del material.
                  </span>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="w-full bg-[#1A1A1A] text-white hover:bg-[#8C6D53] transition-colors py-3.5 rounded-xl text-xs uppercase tracking-widest font-semibold disabled:bg-gray-400 cursor-pointer shadow-sm"
            >
              {guardando ? 'Guardando...' : idEditando ? 'Guardar Cambios' : 'Publicar Material'}
            </button>
          </form>
        </div>

        {/* LISTADO DE MATERIALES EXISTENTES */}
        <div className="space-y-6">
          <h2 className="font-serif text-2xl text-[#1A1A1A]">Materiales Publicados</h2>

          {cargando ? (
            <p className="text-xs uppercase tracking-widest text-gray-400 animate-pulse text-center py-10">
              Cargando catálogo de materiales...
            </p>
          ) : materiales.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl text-center border border-gray-100">
              <p className="text-xs text-gray-500 font-light">No has registrado materiales aún.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {materiales.map((mat) => (
                <div key={mat.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm flex flex-col justify-between group">
                  <div className="relative h-36 w-full bg-gray-100">
                    {mat.imagen ? (
                      <Image
                        src={mat.imagen}
                        alt={mat.nombre}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🪵</div>
                    )}
                  </div>
                  
                  <div className="p-4 space-y-1">
                    <h3 className="font-serif text-sm text-[#1A1A1A] font-medium leading-snug">{mat.nombre}</h3>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-sans block">{mat.categoria}</span>
                  </div>

                  <div className="p-4 pt-0 flex gap-2 border-t border-gray-50">
                    <button
                      onClick={() => prepararEdicion(mat)}
                      className="w-1/2 text-[11px] uppercase tracking-wider text-blue-600 hover:underline font-semibold py-1"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => eliminarMaterial(mat.id)}
                      className="w-1/2 text-[11px] uppercase tracking-wider text-red-600 hover:underline font-semibold py-1"
                    >
                      Eliminar
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