import { sve, brojke } from '../../lib/lista';

// ADMIN — brojke i spisak prijava.
//
// Zaštita je jedna lozinka iz `ADMIN_LOZINKA`. To je namerno najprostije što
// radi posao za jednog čoveka; pravi sistem naloga dolazi tek ako zatreba više
// ljudi. Dve stvari koje NISU preskočene ni ovde:
//
//   • Ako lozinka nije postavljena, ruta se GASI umesto da bude otvorena.
//     Podrazumevano otvoreno je način na koji podaci kupaca završe na internetu.
//   • Poređenje ide u konstantnom vremenu, da se lozinka ne može pogoditi
//     merenjem koliko odgovor kasni.

import { timingSafeEqual } from 'node:crypto';

function lozinkaTacna(data) {
  const prava = process.env.ADMIN_LOZINKA;
  if (!prava) return false;
  const a = Buffer.from(String(data || ''));
  const b = Buffer.from(prava);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  if (!process.env.ADMIN_LOZINKA) {
    return res.status(503).json({ greska: 'Admin nije podešen (nema ADMIN_LOZINKA).' });
  }

  const dato = req.headers['x-admin-lozinka'] || req.query.lozinka;
  if (!lozinkaTacna(dato)) return res.status(401).json({ greska: 'Pogrešna lozinka.' });

  try {
    const [redovi, stat] = await Promise.all([sve(), brojke()]);
    // Telefon se u spisku skraćuje: admin strana se otvara i na javnim mestima,
    // a ceo broj tamo ne treba da stoji dok se ne klikne.
    return res.status(200).json({
      stat,
      redovi: redovi.map((r) => ({
        ime: r.ime,
        mejl: r.mejl,
        telefon: r.telefon ? String(r.telefon).replace(/.(?=.{3})/g, '•') : null,
        grad: r.grad,
        strana: r.strana,
        upisan: r.upisan,
      })),
    });
  } catch (e) {
    console.error('Admin:', e);
    return res.status(500).json({ greska: 'Greška pri čitanju.' });
  }
}
