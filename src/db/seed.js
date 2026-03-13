// seed.js – Täyttää kannan esimerkkidatalla
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db     = require('./index');

async function seed() {
  console.log('⏳ Syötetään esimerkkidata...');
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // Organisaatiot
    const orgRes = await client.query(`
      INSERT INTO organizations (name, type) VALUES
        ('Suomen Jääkiekkoliitto', 'liitto'),
        ('JYP Jyväskylä',         'seura'),
        ('HIFK Helsinki',         'seura'),
        ('TPS Turku',             'seura')
      ON CONFLICT DO NOTHING
      RETURNING id, name
    `);
    console.log('✓ Organisaatiot:', orgRes.rows.length);

    const liittoId = (await client.query("SELECT id FROM organizations WHERE type='liitto' LIMIT 1")).rows[0].id;
    const jypId    = (await client.query("SELECT id FROM organizations WHERE name='JYP Jyväskylä' LIMIT 1")).rows[0].id;
    const hifkId   = (await client.query("SELECT id FROM organizations WHERE name='HIFK Helsinki' LIMIT 1")).rows[0].id;

    // Käyttäjät
    const hash = await bcrypt.hash('demo1234', 10);
    await client.query(`
      INSERT INTO users (name, email, password_hash, role, organization_id) VALUES
        ('Kari Esimerkki',    'kari@sjl.fi',       $1, 'liitto',     $2),
        ('Sari Seuravastaava','sari@jyp.fi',        $1, 'seura',      $3),
        ('Matti Valmentaja',  'matti@jyp.fi',       $1, 'valmentaja', $3),
        ('Admin',             'admin@sjl.fi',       $1, 'liitto',     $2)
      ON CONFLICT (email) DO NOTHING
    `, [hash, liittoId, jypId]);
    console.log('✓ Käyttäjät luotu (salasana: demo1234)');

    // Valmentajat
    await client.query(`
      INSERT INTO coaches (name, email, team, club, level, avatar, organization_id) VALUES
        ('Kari Laamanen',   'kari@jyp.fi',   'JYP U20',        'JYP',   'C', 'KL', $1),
        ('Sanna Virtanen',  'sanna@hifk.fi', 'HIFK U16 naiset','HIFK',  'B', 'SV', $2),
        ('Matti Korhonen',  'matti@tps.fi',  'TPS U18',        'TPS',   'B', 'MK', $1),
        ('Liisa Nieminen',  'liisa@assat.fi','Ässät U16',      'Ässät', 'C', 'LN', $1),
        ('Juhani Hakala',   'juha@ilves.fi', 'Ilves U20',      'Ilves', 'A', 'JH', $1),
        ('Päivi Rautanen',  'paivi@kalpa.fi','KalPa U14',      'KalPa', 'D', 'PR', $1)
      ON CONFLICT DO NOTHING
    `, [liittoId, hifkId]);
    console.log('✓ Valmentajat');

    // Kriteerit
    await client.query(`
      INSERT INTO criteria (name, description, category, source, organization_id) VALUES
        ('Jääajan hyödyntäminen',  'Käytetty jääaika vs. jonottaminen.',           'lajitaidot',    'liitto', $1),
        ('Pallokosketusten määrä', 'Kosketusten määrä harjoituksessa.',             'lajitaidot',    'liitto', $1),
        ('Pelitilanteiden laatu',  'Tilanteiden autenttisuus harjoituksessa.',      'lajitaidot',    'liitto', $1),
        ('Puhe vs. kysyminen',     'Valmentajan tapa käydä asioita läpi.',          'vuorovaikutus', 'liitto', $1),
        ('Palautteen laatu',       'Spesifi / Kerro / Kysy / Vahvista.',            'vuorovaikutus', 'liitto', $1),
        ('Yritys/Keskittyminen',   'Pelaajien motivaatio ja sitoutuminen.',         'vuorovaikutus', 'liitto', $1),
        ('Harjoitussuunnitelma',   'Harjoitussuunnitelman laatu ja selkeys.',       'suunnittelu',   'seura',  $1),
        ('Reflektion laatu',       'Harjoituksen jälkeinen reflektio.',             'suunnittelu',   'seura',  $1)
      ON CONFLICT DO NOTHING
    `, [liittoId]);
    console.log('✓ Kriteerit');

    // Lomakkeet
    const crRows = (await client.query('SELECT id FROM criteria ORDER BY id')).rows.map(r => r.id);
    const userId = (await client.query("SELECT id FROM users WHERE email='kari@sjl.fi'")).rows[0].id;

    await client.query(`
      INSERT INTO forms (name, criteria_ids, active, created_by_id, organization_id) VALUES
        ('Perushavainnointi',      $1, true,  $5, $6),
        ('Vuorovaikutusarviointi', $2, true,  $5, $6),
        ('Lajitaito-arviointi',    $3, true,  $5, $6),
        ('Kokonaishavainnointi',   $4, false, $5, $6)
      ON CONFLICT DO NOTHING
    `, [
      [crRows[0],crRows[1],crRows[3],crRows[4]],
      [crRows[3],crRows[4],crRows[5]],
      [crRows[0],crRows[1],crRows[2]],
      crRows,
      userId, liittoId
    ]);
    console.log('✓ Lomakkeet');

    // Havainnoinnit
    const coaches  = (await client.query('SELECT id FROM coaches ORDER BY id')).rows;
    const forms    = (await client.query('SELECT id FROM forms ORDER BY id')).rows;

    await client.query(`
      INSERT INTO observations (coach_id, form_id, observer_id, observer_name, date, location, notes, ratings, counters) VALUES
        ($1,$5,$9,'Kari Esimerkki','2024-02-10','Jyväskylä jäähalli','Hyvä harjoitusrakenne, palautteen laatu parantunut.',
          $10::jsonb, '{"puhe":12,"kysyminen":8}'::jsonb),
        ($2,$6,$9,'Kari Esimerkki','2024-02-08','Helsinki, Nordis','Positiivinen ilmapiiri, lisää kysymistä.',
          $11::jsonb, '{"puhe":18,"kysyminen":5}'::jsonb),
        ($3,$5,$9,'Kari Esimerkki','2024-01-28','Turkuhalli','Jääaikaa käytetään tehokkaasti.',
          $12::jsonb, '{"puhe":10,"kysyminen":12}'::jsonb),
        ($1,$6,$9,'Kari Esimerkki','2024-01-15','Jyväskylä jäähalli','Kehitystä nähtävissä edellisestä.',
          $13::jsonb, '{"puhe":14,"kysyminen":9}'::jsonb),
        ($4,$7,$9,'Kari Esimerkki','2024-02-01','Pori, Isomäki','Kehitettävää lajitaitoharjoittelussa.',
          $14::jsonb, '{}'::jsonb)
      ON CONFLICT DO NOTHING
    `, [
      coaches[0].id, coaches[1].id, coaches[2].id, coaches[3].id,
      forms[0].id, forms[1].id, forms[2].id,
      null, userId,
      JSON.stringify({[crRows[0]]:4,[crRows[1]]:3,[crRows[3]]:5,[crRows[4]]:4}),
      JSON.stringify({[crRows[3]]:3,[crRows[4]]:3,[crRows[5]]:4}),
      JSON.stringify({[crRows[0]]:5,[crRows[1]]:4,[crRows[3]]:4,[crRows[4]]:4}),
      JSON.stringify({[crRows[3]]:4,[crRows[4]]:3,[crRows[5]]:4}),
      JSON.stringify({[crRows[0]]:3,[crRows[1]]:2,[crRows[2]]:3}),
    ]);
    console.log('✓ Havainnoinnit');

    // Tavoitteet
    await client.query(`
      INSERT INTO goals (coach_id, title, description, deadline, progress, done, created_by) VALUES
        ($1,'Enemmän energiaa treeneissä','Käytän enemmän vaihtelua ja energiaa harjoitusten rakentamisessa.','2024-04-30',60,false,$5),
        ($1,'Kaikkien pelaajien tasaarvoinen palaute','Seuraan palautteen jakautumista eri pelaajille.','2024-03-31',35,false,$5),
        ($2,'Kysymistekniikan kehittäminen','Tavoite: vähintään 40% palautteesta kysymysmuodossa.','2024-05-31',25,false,$5),
        ($3,'Harjoitussuunnitelman etukäteen tekeminen','Jokainen harjoitus suunniteltu vähintään 24h etukäteen.','2024-02-28',100,true,$5)
      ON CONFLICT DO NOTHING
    `, [coaches[0].id, coaches[1].id, coaches[2].id, coaches[3].id, userId]);
    console.log('✓ Tavoitteet');

    // Ilmoitukset
    await client.query(`
      INSERT INTO notifications (user_id, text, type, read) VALUES
        ($1, 'Täytä havainnointilomake: 11.10.2023, Viikkotreenit', 'urgent', false),
        ($1, 'Koulutustapahtuma 30.10.2023', 'info', false),
        ($1, 'Uusi itsearviointi – Muista vastata', 'info', true)
      ON CONFLICT DO NOTHING
    `, [userId]);
    console.log('✓ Ilmoitukset');

    await client.query('COMMIT');
    console.log('\n✅ Seed valmis! Kirjautuminen: kari@sjl.fi / demo1234');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed-virhe:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    client.release();
    await db.pool.end();
  }
}

seed();
