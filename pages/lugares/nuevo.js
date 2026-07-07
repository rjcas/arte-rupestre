import { requireUser } from '../../lib/auth';
import Layout from '../../components/Layout';
import LugarForm from '../../components/LugarForm';

export async function getServerSideProps({ req }) {
  const user = requireUser(req);
  if (!user) return { redirect: { destination: '/login', permanent: false } };
  return { props: { user } };
}

export default function NuevoLugar({ user }) {
  return (
    <Layout user={user}>
      <div className="encabezado-pagina">
        <div>
          <span className="eyebrow">I. Lugar</span>
          <h1>Nuevo lugar</h1>
        </div>
      </div>
      <div className="tarjeta">
        <LugarForm />
      </div>
    </Layout>
  );
}
