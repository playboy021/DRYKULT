import { dodaj } from '../../lib/lista';

// PRIJAVA NA LISTU ČEKANJA.
//
// Prva ruta na sajtu koja prima podatke spolja. Zato ovde stoje i provere koje
// izgledaju kao višak dok se ne pojavi prvi bot: sve što dolazi sa interneta je
// neproverено dok se ne proveri OVDE, na serveru. Provera u browseru je samo
// ljubaznost prema korisniku — nju zaobilazi svako ko otvori konzolu.

const MEJL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Gruba brana po IP adresi, u memoriji. Nije zaštita od ozbiljnog napada —
// svaka serverless instanca ima svoju mapu — ali zaustavlja slučajno dvostruko
// slanje i najprostije skripte. Prava brana dolazi sa Vercel firewall-om ako
// zatreba.
const POKUSAJI = new Map();
const PROZOR = 60_000;
const NAJVISE = 5;

function prebrzo(ip) {
  const sada = Date.now();
  const lista = (POKUSAJI.get(ip) || []).filter((t) => sada - t < PROZOR);
  lista.push(sada);
  POKUSAJI.set(ip, lista);
  if (POKUSAJI.size > 5000) POKUSAJI.clear(); // da mapa ne raste bez kraja
  return lista.length > NAJVISE;
}

const ocisti = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ greska: 'Samo POST.' });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'lokalno';
  if (prebrzo(ip)) return res.status(429).json({ greska: 'Previše pokušaja. Sačekaj minut.' });

  const telo = req.body && typeof req.body === 'object' ? req.body : {};
  const ime = ocisti(telo.ime, 80);
  const mejl = ocisti(telo.mejl, 160).toLowerCase();
  const telefon = ocisti(telo.telefon, 40);
  const grad = ocisti(telo.grad, 80);
  const strana = ocisti(telo.strana, 20);
  const pristanak = telo.pristanak === true;

  // Med za botove: polje koje je u formi sakriveno i čovek ga nikad ne popuni.
  // Ako je puno, tiho se vraća uspeh — bot ne sme da sazna da je odbijen.
  if (ocisti(telo.adresa, 200)) return res.status(200).json({ ok: true, nov: true });

  if (ime.length < 2) return res.status(400).json({ greska: 'Upiši ime.' });
  if (!MEJL.test(mejl)) return res.status(400).json({ greska: 'Mejl ne izgleda ispravno.' });
  // Pristanak nije formalnost: bez njega nema osnova za obradu podataka.
  if (!pristanak) return res.status(400).json({ greska: 'Treba tvoja saglasnost da čuvamo podatke.' });

  try {
    const { nov } = await dodaj({ ime, mejl, telefon, grad, strana, izvor: 'sajt', pristanak });
    return res.status(200).json({ ok: true, nov });
  } catch (e) {
    if (e.message === 'NEMA_BAZE') {
      // Baza nije povezana. NE pravimo se da je prijava primljena — to bi
      // značilo da čovek misli da je na listi, a nije.
      console.error('Lista čekanja: nema POSTGRES_URL u produkciji.');
      return res.status(503).json({ greska: 'Prijave još nisu otvorene. Pokušaj ponovo uskoro.' });
    }
    console.error('Lista čekanja:', e);
    return res.status(500).json({ greska: 'Nešto je puklo kod nas. Pokušaj ponovo.' });
  }
}
