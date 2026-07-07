import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Layout({ user, children }) {
  const router = useRouter();

  async function cerrarSesion() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="marca">
          Arte Rupestre
          <small>Registro de sitios</small>
        </div>
        <nav>
          <Link href="/">Lugares</Link>
        </nav>
        {user && (
          <div className="usuario">
            Conectado como <strong>{user.nombre || user.username}</strong>
            <button onClick={cerrarSesion}>Cerrar sesión</button>
          </div>
        )}
      </aside>
      <main className="contenido">{children}</main>
    </div>
  );
}
