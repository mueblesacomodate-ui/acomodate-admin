'use client';

import { useState } from 'react';
import Link from 'next/link';
import AdminSidebar from '@/app/components/AdminSidebar';

export default function AdminPagosPage() {
  const [copiado, setCopiado] = useState(false);
  const webhookUrl = 'https://us-central1-acomodate-muebles.cloudfunctions.net/avisoBold';

  const handleCopiarWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex font-sans text-[#1A1A1A]">
      
      <AdminSidebar />

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-8 md:p-12 space-y-6 overflow-y-auto">
        
        <div className="border-b border-gray-200 pb-4">
          <span className="text-[10px] tracking-[0.3em] uppercase text-gray-500 block font-sans mb-1">
            ACOMÓDATE MUEBLES · FINANZAS
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-normal text-[#1A1A1A]">
            Pagos
          </h2>
        </div>

        {/* TARJETA 1: CONEXIÓN BOLD */}
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-6 max-w-2xl">
          <h3 className="font-serif text-xl text-[#1A1A1A]">
            Conecta tu cuenta de Bold
          </h3>

          <div className="bg-[#FAF8F5] border border-gray-200 p-4 rounded-xl text-xs text-gray-700 font-light">
            Tu tienda cobra con Bold. Llave secreta terminada en <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200 font-semibold text-[#1A1A1A]">---EyzQ</code>, guardada el 8 oct.
          </div>

          <div>
            <button className="border border-[#1A1A1A] text-[#1A1A1A] px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold hover:bg-[#1A1A1A] hover:text-white transition-colors cursor-pointer">
              Cambiar las llaves
            </button>
          </div>
        </div>

        {/* TARJETA 2: CONFIGURACIÓN WEBHOOK */}
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 max-w-2xl">
          <p className="text-xs text-gray-600 font-light leading-relaxed">
            Para que Bold nos avise cada pago, en <strong className="font-medium text-[#1A1A1A]">Bold → Integraciones → Webhooks</strong> pega esta dirección:{' '}
            <code className="bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg text-[11px] font-mono break-all font-semibold text-[#1A1A1A] block mt-2">
              {webhookUrl}
            </code>
          </p>
          <button
            onClick={handleCopiarWebhook}
            className="bg-[#1A1A1A] text-white px-6 py-3 rounded-xl text-xs uppercase tracking-widest font-semibold hover:bg-[#8C6D53] transition-colors cursor-pointer flex-shrink-0 shadow-sm"
          >
            {copiado ? '¡Copiado!' : 'Copiar'}
          </button>
        </div>

      </main>

    </div>
  );
}