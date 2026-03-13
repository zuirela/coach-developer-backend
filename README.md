# Coach Developer Tool – Backend API

Node.js + Express + PostgreSQL REST API.

## Paikallinen kehitys

```bash
# 1. Asenna riippuvuudet
npm install

# 2. Kopioi ympäristömuuttujat
cp .env.example .env
# → Täytä DATABASE_URL ja JWT_SECRET

# 3. Aja migraatio (luo taulut)
npm run db:migrate

# 4. Täytä esimerkkidata
npm run db:seed

# 5. Käynnistä kehityspalvelin
npm run dev
```

## Render.com-deploy

1. Luo uusi GitHub-repo ja pushaa tämä koodi sinne
2. Mene [render.com](https://render.com) → New → Blueprint
3. Yhdistä GitHub-repo → Render löytää `render.yaml` automaattisesti
4. Klikkaa **Apply** → Render luo tietokannan + web-palvelun
5. Aja migraatio Render Shell:issä: `npm run db:migrate && npm run db:seed`

## API-endpointit

| Metodi | Reitti                        | Kuvaus                  |
|--------|-------------------------------|-------------------------|
| POST   | /api/auth/login               | Kirjautuminen           |
| POST   | /api/auth/register            | Rekisteröinti           |
| GET    | /api/auth/me                  | Oma profiili            |
| GET    | /api/coaches                  | Kaikki valmentajat      |
| POST   | /api/coaches                  | Uusi valmentaja         |
| GET    | /api/observations?coachId=X   | Havainnoinnit           |
| POST   | /api/observations             | Uusi havainnointi       |
| GET    | /api/criteria                 | Kriteerit               |
| GET    | /api/forms                    | Lomakkeet               |
| GET    | /api/goals?coachId=X          | Tavoitteet              |
| PATCH  | /api/goals/:id/progress       | Päivitä edistyminen     |
| POST   | /api/goals/:id/comments       | Lisää kommentti         |
| GET    | /api/selfassessments          | Itsearvioinnnit         |
| GET    | /api/notifications            | Ilmoitukset             |
| PATCH  | /api/notifications/read-all   | Merkitse luetuksi       |

## Demo-tunnukset (seed-datan jälkeen)

- **kari@sjl.fi** / demo1234 (liitto)
- **sari@jyp.fi** / demo1234 (seura)
- **matti@jyp.fi** / demo1234 (valmentaja)
