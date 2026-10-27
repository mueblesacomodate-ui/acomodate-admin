'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Link from 'next/link';
import Image from 'next/image';
import { db, storage } from '../lib/firebase';

interface ItemConfig {
  id: string;
  nombre: string;
  imagen?: string;
  tipo: 'tipo_mueble' | 'estilo' | 'pata' | 'costura';
}

export default function GestionConfiguradorPage() {
  const [items, setItems] = useState<ItemConfig[]>([]);
  const [cargando, setCargando] = useState(true);

  // Formulario Tipos de Mueble
  const [nombreMueble, setNombreMueble] = useState('');
  const [imagenMuebleFile, setImagenMuebleFile] = useState<File | null>(null);
  const [previewMueble, setPreviewMueble] = useState<string | null>(null);

  // Formulario Estilos / Acabados
  const [nuevoEstilo, setNuevoEstilo] = useState('');
  const [nuevaPata, setNuevaPata] = useState('');
  const [nuevaCostura, setNuevaCostura] = useState('');

  const [guardando, setGuardando] = useState(false);

  const inputEstilo = "w-full border border-gray-200 rounded-xl p-3 text-sm text-[#1A1A1A] font-medium placeholder:text-gray-400 focus:outline-none focus:border-[#8C6D53] bg-white";

  async function cargarOpciones() {
    try {
      setCargando(true);
      const querySnapshot = await getDocs(collection(db, 'configurador_opciones'));
      const lista: ItemConfig[] = [];
      querySnapshot.forEach((docSnap) => {
        lista.push({ id: docSnap.id, ...docSnap.data() } as ItemConfig);
      });
      setItems(lista);
    } catch (error) {
      console.error('Error al cargar opciones:', error);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarOpciones();
  }, []);

  // Agregar Tipo de Mueble con Foto
  const handleAgregarMueble = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagenMuebleFile) {
      alert('Por favor selecciona una imagen para el tipo de mueble.');
      return;
    }

    try {
      setGuardando(true);
      const storageRef = ref(storage, `configurador/mueble_${Date.now()}_${imagenMuebleFile.name}`);
      await uploadBytes(storageRef, imagenMuebleFile);
      const urlImagen = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'configurador_opciones'), {
        nombre: nombreMueble.trim(),
        imagen: urlImagen,
        tipo: 'tipo_mueble',
        creadoEn: serverTimestamp(),
      });

      setNombreMueble('');
      setImagenMuebleFile(null);
      setPreviewMueble(null);
      cargarOpciones();
    } catch (error) {
      console.error('Error al guardar mueble:', error);
    } finally {
      setGuardando(false);
    }
  };

  // Agregar Opción Genérica (Estilo, Pata o Costura)
  const handleAgregarOpcionTexto = async (nombre: string, tipo: ItemConfig['tipo'], setReset: (val: string) => void) => {
    if (!nombre.trim()) return;
    try {
      setGuardando(true);
      await addDoc(collection(db, 'configurador_opciones'), {
        nombre: nombre.trim(),
        tipo,
        creadoEn: serverTimestamp(),
      });
      setReset('');
      cargarOpciones();
    } catch (error) {
      console.error('Error al guardar opción:', error);
    } finally {
      setGuardando(false);
    }
  };

  const eliminarItem = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta opción?')) return;
    try {
      await deleteDoc(doc(db, 'configurador_opciones', id));
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  const tiposMuebles = items.filter((i) => i.tipo === 'tipo_mueble');
  const estilos = items.filter((i) => i.tipo === 'estilo');
  const patas = items.filter((i) => i.tipo === 'pata');
  const costuras = items.filter((i) => i.tipo === 'costura');

  return (
    <main className="min-h-screen bg-[#FDFBF7] py-12 px-6">
      <div className="max-w-5xl mx-auto space-y-12">
        
        <div className="flex items-center justify-between border-b border-gray-200 pb-6">
          <div>
            <span className="text-[10px] tracking-[0.3em] uppercase text-gray-500 block font-sans">
              CONFIGURADOR "A TU MEDIDA"
            </span>
            <h1 className="font-serif text-3xl text-[#1A1A1A]">Opciones del Wizard</h1>
          </div>
          <Link href="/" className="text-xs uppercase tracking-widest text-gray-600 hover:text-black font-medium transition-colors">
            ← Volver al Dashboard
          </Link>
        </div>

        {/* 1. TIPOS DE MUEBLE */}
        <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-6">
          <h2 className="font-serif text-xl text-[#1A1A1A] border-b border-gray-100 pb-2">
            1. Tipos de Mueble (Con Foto)
          </h2>

          <form onSubmit={handleAgregarMueble} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs uppercase text-[#1A1A1A] mb-1 font-semibold">Nombre (ej. Sofá, Cama)</label>
              <input type="text" required value={nombreMueble} onChange={(e) => setNombreMueble(e.target.value)} placeholder="Ej. Poltrona" className={inputEstilo} />
            </div>

            <div className="w-full md:w-auto">
              <label className="block text-xs uppercase text-[#1A1A1A] mb-1 font-semibold">Foto</label>
              <input type="file" accept="image/*" required onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) { setImagenMuebleFile(file); setPreviewMueble(URL.createObjectURL(file)); }
              }} className="text-xs text-gray-500 border border-gray-200 rounded-xl p-2.5 bg-white" />
            </div>

            <button type="submit" disabled={guardando} className="bg-[#1A1A1A] text-white px-6 py-3.5 rounded-xl text-xs uppercase font-semibold hover:bg-[#8C6D53] transition-colors">
              Agregar Mueble
            </button>
          </form>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 pt-4">
            {tiposMuebles.map((item) => (
              <div key={item.id} className="relative rounded-xl border border-gray-200 overflow-hidden group bg-gray-50 p-2 text-center">
                {item.imagen && (
                  <div className="relative h-24 w-full rounded-lg overflow-hidden mb-2">
                    <Image src={item.imagen} alt={item.nombre} fill className="object-cover" />
                  </div>
                )}
                <span className="text-xs font-semibold text-[#1A1A1A] block">{item.nombre}</span>
                <button onClick={() => eliminarItem(item.id)} className="text-[10px] text-red-600 uppercase font-bold mt-1 hover:underline">Eliminar</button>
              </div>
            ))}
          </div>
        </section>

        {/* 2. ESTILOS */}
        <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-6">
          <h2 className="font-serif text-xl text-[#1A1A1A] border-b border-gray-100 pb-2">
            2. Estilos Disponibles
          </h2>
          <div className="flex gap-4">
            <input type="text" value={nuevoEstilo} onChange={(e) => setNuevoEstilo(e.target.value)} placeholder="Ej. Japandi, Mid Century" className={inputEstilo} />
            <button onClick={() => handleAgregarOpcionTexto(nuevoEstilo, 'estilo', setNuevoEstilo)} className="bg-[#1A1A1A] text-white px-6 py-3.5 rounded-xl text-xs uppercase font-semibold hover:bg-[#8C6D53]">
              Agregar Estilo
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {estilos.map((item) => (
              <span key={item.id} className="bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-medium text-[#1A1A1A] flex items-center gap-2">
                {item.nombre}
                <button onClick={() => eliminarItem(item.id)} className="text-red-500 font-bold hover:text-red-700">✕</button>
              </span>
            ))}
          </div>
        </section>

        {/* 3. ACABADOS (PATAS Y COSTURAS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Patas */}
          <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-4">
            <h2 className="font-serif text-lg text-[#1A1A1A] border-b border-gray-100 pb-2">Opciones de Patas</h2>
            <div className="flex gap-2">
              <input type="text" value={nuevaPata} onChange={(e) => setNuevaPata(e.target.value)} placeholder="Ej. Madera oscura" className={inputEstilo} />
              <button onClick={() => handleAgregarOpcionTexto(nuevaPata, 'pata', setNuevaPata)} className="bg-[#1A1A1A] text-white px-4 py-3 rounded-xl text-xs uppercase font-semibold">
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {patas.map((item) => (
                <span key={item.id} className="bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-medium text-[#1A1A1A] flex items-center gap-2">
                  {item.nombre}
                  <button onClick={() => eliminarItem(item.id)} className="text-red-500 font-bold">✕</button>
                </span>
              ))}
            </div>
          </section>

          {/* Costuras */}
          <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-4">
            <h2 className="font-serif text-lg text-[#1A1A1A] border-b border-gray-100 pb-2">Opciones de Costuras</h2>
            <div className="flex gap-2">
              <input type="text" value={nuevaCostura} onChange={(e) => setNuevaCostura(e.target.value)} placeholder="Ej. Capitoné" className={inputEstilo} />
              <button onClick={() => handleAgregarOpcionTexto(nuevaCostura, 'costura', setNuevaCostura)} className="bg-[#1A1A1A] text-white px-4 py-3 rounded-xl text-xs uppercase font-semibold">
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {costuras.map((item) => (
                <span key={item.id} className="bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-medium text-[#1A1A1A] flex items-center gap-2">
                  {item.nombre}
                  <button onClick={() => eliminarItem(item.id)} className="text-red-500 font-bold">✕</button>
                </span>
              ))}
            </div>
          </section>

        </div>

      </div>
    </main>
  );
}