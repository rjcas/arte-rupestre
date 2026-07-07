import { requireUser } from '../../../lib/auth';
import { query } from '../../../lib/db';
import Layout from '../../../components/Layout';
import LugarForm from '../../../components/LugarForm';

export async function getServerSideProps({ req, params }) {
  const user = requireUser(req);
  if (!user) return { redirect: { destination: '/login', permanent: false } };
  const result = await query('SELECT * FROM lugares WHERE id = $1', [params.id]);
  const lugar = result.rows[0];
  if (!lugar) return { notFound: true };
  return { props: { user, lugar: JSON.parse(JSON.stringify(lugar)) } };
}

export default function EditarLugar({ user, lugar }) {
  return (
    <Layout user={user}>
      <div className="encabezado-pagina">
        <div>
          <span className="eyebrow">I. Lugar</span>
          <h1>Editar {lugar.sitio}</h1>
        </div>
      </div>
      <div className="tarjeta">
        <LugarForm inicial={lugar} lugarId={lugar.id} />
      </div>
    </Layout>
  );
}
