import { AuthProvider } from './context/AuthContext';
import './globals.css';

export const metadata = {
  title: 'Admin - Acomódate Muebles',
  description: 'Panel de administración del catálogo y proyectos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-[#FDFBF7] antialiased text-gray-800">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}