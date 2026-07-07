import { useState } from 'react';
import { useRouter } from 'next/router';
import { requireUser } from '../lib/auth';

export async function getServerSideProps({ req }) {
  const user = requireUser(req);
  if (user) {
    return { redirect: { destination: '/', permanent: false } };
  }
  return { props: {} };
}

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    setCargando(false);
    if (res.ok) {
      router.push('/');
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'No se pudo iniciar sesión.');
    }
  }

  return (
    <div className="login-shell">
      <div className="login-tarjeta">
        <span className="eyebrow">Acceso de editores</span>
        <h1>Arte Rupestre</h1>
        {error && <div className="error">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="campo">
            <label>Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="campo">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn" type="submit" style={{ width: '100%' }} disabled={cargando}>
            {cargando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
