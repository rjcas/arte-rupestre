import { useState } from 'react';
import { requireAdmin } from '../../lib/auth';
import { query } from '../../lib/db';
import Layout from '../../components/Layout';

export async function getServerSideProps({ req }) {
  const admin = requireAdmin(req);
  if (!admin) {
    // Si está logueado pero no es admin, lo mandamos al inicio; si no está logueado, al login.
    const { requireUser } = require('../../lib/auth');
    const user = requireUser(req);
    return { redirect: { destination: user ? '/' : '/login', permanent: false } };
  }
  const result = await query(
    'SELECT id, username, nombre, rol, creado_en FROM usuarios ORDER BY creado_en'
  );
  return {
    props: { user: admin, usuarios: JSON.parse(JSON.stringify(result.rows)) },
  };
}

export default function PanelUsuarios({ user, usuarios: usuariosIniciales }) {
  const [usuarios, setUsuarios] = useState(usuariosIniciales);
  const [nuevo, setNuevo] = useState({ username: '', nombre: '', password: '', rol: 'editor' });
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState(null); // id del usuario en edición
  const [passwordReset, setPasswordReset] = useState('');

  function set(campo, valor) {
    setNuevo((v) => ({ ...v, [campo]: valor }));
  }

  async function crear(e) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    const res = await fetch('/api/admin/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevo),
    });
    setGuardando(false);
    if (res.ok) {
      const data = await res.json();
      setUsuarios((u) => [...u, data]);
      setNuevo({ username: '', nombre: '', password: '', rol: 'editor' });
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'No se pudo crear el editor.');
    }
  }

  async function guardarEdicion(u) {
    setError('');
    const body = { nombre: u.nombre, rol: u.rol };
    if (passwordReset) body.password = passwordReset;
    const res = await fetch(`/api/admin/usuarios/${u.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      setUsuarios((prev) => prev.map((x) => (x.id === data.id ? data : x)));
      setEditando(null);
      setPasswordReset('');
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'No se pudo guardar.');
    }
  }

  async function borrar(u) {
    if (!confirm(`¿Eliminar al editor "${u.username}"? Esta acción no se puede deshacer.`)) return;
    setError('');
    const res = await fetch(`/api/admin/usuarios/${u.id}`, { method: 'DELETE' });
    if (res.ok) {
      setUsuarios((prev) => prev.filter((x) => x.id !== u.id));
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'No se pudo eliminar.');
    }
  }

  return (
    <Layout user={user}>
      <div className="encabezado-pagina">
        <div>
          <span className="eyebrow">Administración</span>
          <h1>Editores</h1>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="tarjeta">
        <table>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Alta</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                {editando === u.id ? (
                  <>
                    <td>{u.username}</td>
                    <td>
                      <input
                        type="text"
                        value={u.nombre || ''}
                        onChange={(e) =>
                          setUsuarios((prev) =>
                            prev.map((x) => (x.id === u.id ? { ...x, nombre: e.target.value } : x))
                          )
                        }
                      />
                    </td>
                    <td>
                      <select
                        value={u.rol}
                        onChange={(e) =>
                          setUsuarios((prev) =>
                            prev.map((x) => (x.id === u.id ? { ...x, rol: e.target.value } : x))
                          )
                        }
                      >
                        <option value="editor">Editor</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </td>
                    <td colSpan={2}>
                      <input
                        type="password"
                        placeholder="Nueva contraseña (opcional)"
                        value={passwordReset}
                        onChange={(e) => setPasswordReset(e.target.value)}
                        style={{ marginBottom: 6 }}
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn" type="button" onClick={() => guardarEdicion(u)}>
                          Guardar
                        </button>
                        <button
                          className="btn secundario"
                          type="button"
                          onClick={() => {
                            setEditando(null);
                            setPasswordReset('');
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{u.username}</td>
                    <td>{u.nombre || '—'}</td>
                    <td>{u.rol === 'admin' ? 'Administrador' : 'Editor'}</td>
                    <td>{u.creado_en ? new Date(u.creado_en).toLocaleDateString('es-AR') : '—'}</td>
                    <td style={{ display: 'flex', gap: 8 }}>
                      <button className="btn secundario" type="button" onClick={() => setEditando(u.id)}>
                        Editar
                      </button>
                      <button className="btn secundario" type="button" onClick={() => borrar(u)}>
                        Eliminar
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="tarjeta">
        <h3 style={{ marginTop: 0 }}>Nuevo editor</h3>
        <form onSubmit={crear}>
          <div className="grid-3">
            <div className="campo">
              <label>Usuario</label>
              <input
                type="text"
                value={nuevo.username}
                onChange={(e) => set('username', e.target.value)}
                required
              />
            </div>
            <div className="campo">
              <label>Nombre completo</label>
              <input type="text" value={nuevo.nombre} onChange={(e) => set('nombre', e.target.value)} />
            </div>
            <div className="campo">
              <label>Rol</label>
              <select value={nuevo.rol} onChange={(e) => set('rol', e.target.value)}>
                <option value="editor">Editor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          <div className="campo" style={{ maxWidth: 320 }}>
            <label>Contraseña</label>
            <input
              type="password"
              value={nuevo.password}
              onChange={(e) => set('password', e.target.value)}
              required
            />
          </div>
          <button className="btn" type="submit" disabled={guardando}>
            {guardando ? 'Creando…' : 'Crear editor'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
