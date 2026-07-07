import Link from 'next/link';
import { useRouter } from 'next/router';

export default function PestañasMotivo({ motivoId }) {
  const router = useRouter();
  const base = `/motivos/${motivoId}`;
  const tabs = [
    { href: base, label: 'Datos generales' },
    { href: `${base}/tecnica`, label: 'III. Técnicas' },
    { href: `${base}/antropomorfo`, label: 'IV. Antropomorfos' },
    { href: `${base}/operaciones`, label: 'V. Operaciones cognitivas' },
    { href: `${base}/conjunto`, label: 'VI. Conjunto' },
  ];
  return (
    <div className="pestañas">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} className={router.asPath === t.href ? 'activa' : ''}>
          {t.label}
        </Link>
      ))}
    </div>
  );
}
