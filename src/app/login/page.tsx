'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '../lib/firebase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (err: any) {
      console.error(err);
      setError('Credenciales incorrectas o usuario no encontrado.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <div className="text-center mb-8">
          <span className="text-xs tracking-[0.3em] uppercase text-gray-400 block mb-2 font-sans">
            ACOMÓDATE MUEBLES
          </span>
          <h1 className="font-serif text-3xl text-[#1A1A1A]">Acceso Admin</h1>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-medium">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@acomodatemuebles.com"
              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#8C6D53]"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-medium">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#8C6D53]"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-[#1A1A1A] text-white hover:bg-[#8C6D53] transition-colors py-3.5 rounded-xl text-xs uppercase tracking-widest font-medium disabled:bg-gray-400 cursor-pointer"
          >
            {cargando ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </main>
  );
}