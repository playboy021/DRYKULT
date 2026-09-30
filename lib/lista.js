// LISTA ČEKANJA — čuvanje prijava za pretprodaju.
//
// Dva izvora, jedan interfejs:
//   • PRODUKCIJA — Vercel Postgres, ako postoji `POSTGRES_URL`.
//   • RAZVOJ — običan JSON fajl u `.podaci/`, da se cela stvar može isprobati
//     lokalno bez ijedne baze.
//
// ZAŠTO NE SAMO FAJL: na Vercelu je sistem fajlova **efemeran** — svaka
// funkcija se diže u svom kontejneru i sve što upiše nestaje. Fajl bi radio na
// lokalu i tiho gubio prijave u produkciji. To je najgora vrsta kvara: izgleda
// kao da radi. Zato produkcija bez `POSTGRES_URL` NAMERNO odbija upis, umesto
// da se pravi da je sačuvala.
//
// Podaci su lični (ZZPL / GDPR): prikuplja se samo ono bez čega pretprodaja ne
// radi — ime i mejl. Telefon i grad su neobavezni jer trebaju tek kad se šalje
// roba. Godište se NE prikuplja: ničemu ovde ne služi, a prikupljanje podataka
// koji ne trebaju je samo po sebi prekršaj (načelo minimizacije).

import { promises as fs } from 'node:fs';
import path from 'node:path';

const FAJL = path.join(process.cwd(), '.podaci', 'lista.json');
const imaBazu = () => Boolean(process.env.POSTGRES_URL);
export const uProdukciji = () => process.env.NODE_ENV === 'production';

// --- fajl (samo razvoj) -----------------------------------------------------

async function citajFajl() {
  try {
    return JSON.parse(await fs.readFile(FAJL, 'utf8'));
  } catch {
    return [];
  }
}

async function pisiFajl(redovi) {
  await fs.mkdir(path.dirname(FAJL), { recursive: true });
  await fs.writeFile(FAJL, JSON.stringify(redovi, null, 2));
}

// --- Postgres ---------------------------------------------------------------

let tabelaSpremna = false;
async function sql() {
  const { sql } = await import('@vercel/postgres');
  if (!tabelaSpremna) {
    await sql`
      CREATE TABLE IF NOT EXISTS lista_cekanja (
        id          SERIAL PRIMARY KEY,
        ime         TEXT NOT NULL,
        mejl        TEXT NOT NULL UNIQUE,
        telefon     TEXT,
        grad        TEXT,
        strana      TEXT,
        izvor       TEXT,
        pristanak   BOOLEAN NOT NULL DEFAULT FALSE,
        upisan      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    tabelaSpremna = true;
  }
  return sql;
}

// --- javni interfejs --------------------------------------------------------

export async function dodaj(prijava) {
  if (imaBazu()) {
    const q = await sql();
    // ON CONFLICT: isti mejl se ne duplira nego osvežava. Bez toga bi svako
    // dvostruko slanje forme pravilo novi red i broj prijava bi lagao.
    const { rows } = await q`
      INSERT INTO lista_cekanja (ime, mejl, telefon, grad, strana, izvor, pristanak)
      VALUES (${prijava.ime}, ${prijava.mejl}, ${prijava.telefon || null},
              ${prijava.grad || null}, ${prijava.strana || null},
              ${prijava.izvor || null}, ${prijava.pristanak === true})
      ON CONFLICT (mejl) DO UPDATE SET
        ime = EXCLUDED.ime,
        telefon = COALESCE(EXCLUDED.telefon, lista_cekanja.telefon),
        grad = COALESCE(EXCLUDED.grad, lista_cekanja.grad),
        strana = COALESCE(EXCLUDED.strana, lista_cekanja.strana)
      RETURNING (xmax = 0) AS nov
    `;
    return { nov: rows[0]?.nov !== false };
  }

  if (uProdukciji()) {
    // Vidi napomenu na vrhu fajla: bolje glasno pući nego tiho gubiti prijave.
    throw new Error('NEMA_BAZE');
  }

  const redovi = await citajFajl();
  const i = redovi.findIndex((r) => r.mejl === prijava.mejl);
  const red = { ...prijava, upisan: new Date().toISOString() };
  if (i >= 0) {
    // Prazno polje NE briše ono što je već upisano — isto što `COALESCE` radi
    // na Postgresu. Bez ovoga bi čovek koji se prijavi drugi put bez telefona
    // ostao bez broja koji je prvi put ostavio.
    const spojeno = { ...redovi[i] };
    for (const [k, v] of Object.entries(red)) if (v !== '' && v != null) spojeno[k] = v;
    redovi[i] = spojeno;
    await pisiFajl(redovi);
    return { nov: false };
  }
  redovi.push(red);
  await pisiFajl(redovi);
  return { nov: true };
}

export async function sve() {
  if (imaBazu()) {
    const q = await sql();
    const { rows } = await q`SELECT * FROM lista_cekanja ORDER BY upisan DESC`;
    return rows;
  }
  if (uProdukciji()) return [];
  const redovi = await citajFajl();
  return [...redovi].sort((a, b) => (a.upisan < b.upisan ? 1 : -1));
}

export async function brojke() {
  const redovi = await sve();
  const po = (kljuc) =>
    redovi.reduce((a, r) => {
      const v = r[kljuc] || '—';
      a[v] = (a[v] || 0) + 1;
      return a;
    }, {});
  const dan = 24 * 60 * 60 * 1000;
  const sada = Date.now();
  return {
    ukupno: redovi.length,
    danas: redovi.filter((r) => sada - new Date(r.upisan).getTime() < dan).length,
    nedelja: redovi.filter((r) => sada - new Date(r.upisan).getTime() < 7 * dan).length,
    poStrani: po('strana'),
    poGradu: po('grad'),
    izvorPodataka: imaBazu() ? 'Postgres' : 'lokalni fajl (razvoj)',
  };
}
