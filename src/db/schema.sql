-- Coach Developer Tool – SJL
-- PostgreSQL Schema

-- Organisaatiot (liitto, seurat)
CREATE TABLE IF NOT EXISTS organizations (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  type        VARCHAR(20)  NOT NULL CHECK (type IN ('liitto','seura')),
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- Käyttäjät
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(200) NOT NULL,
  email           VARCHAR(200) NOT NULL UNIQUE,
  password_hash   VARCHAR(200) NOT NULL,
  role            VARCHAR(20)  NOT NULL CHECK (role IN ('liitto','seura','valmentaja')),
  organization_id INTEGER REFERENCES organizations(id),
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Valmentajat
CREATE TABLE IF NOT EXISTS coaches (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(200) NOT NULL,
  email           VARCHAR(200),
  team            VARCHAR(200),
  club            VARCHAR(200),
  level           VARCHAR(5)   NOT NULL DEFAULT 'D' CHECK (level IN ('A','B','C','D')),
  avatar          VARCHAR(5),
  organization_id INTEGER REFERENCES organizations(id),
  user_id         INTEGER REFERENCES users(id),
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Kriteerit
CREATE TABLE IF NOT EXISTS criteria (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(300) NOT NULL,
  description     TEXT,
  category        VARCHAR(50)  NOT NULL CHECK (category IN ('lajitaidot','vuorovaikutus','suunnittelu')),
  source          VARCHAR(20)  NOT NULL DEFAULT 'liitto' CHECK (source IN ('liitto','seura')),
  organization_id INTEGER REFERENCES organizations(id),
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Havainnointilomakkeet
CREATE TABLE IF NOT EXISTS forms (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(300) NOT NULL,
  criteria_ids    INTEGER[]    NOT NULL DEFAULT '{}',
  active          BOOLEAN DEFAULT TRUE,
  created_by_id   INTEGER REFERENCES users(id),
  organization_id INTEGER REFERENCES organizations(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Havainnoinnit
CREATE TABLE IF NOT EXISTS observations (
  id              SERIAL PRIMARY KEY,
  coach_id        INTEGER REFERENCES coaches(id) ON DELETE CASCADE,
  form_id         INTEGER REFERENCES forms(id),
  observer_id     INTEGER REFERENCES users(id),
  observer_name   VARCHAR(200),
  date            DATE NOT NULL,
  location        VARCHAR(300),
  notes           TEXT,
  ratings         JSONB NOT NULL DEFAULT '{}',
  counters        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Itsearvioinnnit
CREATE TABLE IF NOT EXISTS self_assessments (
  id          SERIAL PRIMARY KEY,
  coach_id    INTEGER REFERENCES coaches(id) ON DELETE CASCADE,
  user_id     INTEGER REFERENCES users(id),
  date        DATE NOT NULL,
  ratings     JSONB NOT NULL DEFAULT '{}',
  reflection  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Tavoitteet
CREATE TABLE IF NOT EXISTS goals (
  id          SERIAL PRIMARY KEY,
  coach_id    INTEGER REFERENCES coaches(id) ON DELETE CASCADE,
  title       VARCHAR(400) NOT NULL,
  description TEXT,
  deadline    DATE,
  progress    INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  done        BOOLEAN DEFAULT FALSE,
  comments    JSONB NOT NULL DEFAULT '[]',
  created_by  INTEGER REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Ilmoitukset
CREATE TABLE IF NOT EXISTS notifications (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  type        VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info','urgent','success')),
  read        BOOLEAN DEFAULT FALSE,
  date        DATE DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indeksit
CREATE INDEX IF NOT EXISTS idx_observations_coach    ON observations(coach_id);
CREATE INDEX IF NOT EXISTS idx_observations_date     ON observations(date DESC);
CREATE INDEX IF NOT EXISTS idx_goals_coach           ON goals(coach_id);
CREATE INDEX IF NOT EXISTS idx_selfass_coach         ON self_assessments(coach_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user    ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_users_email           ON users(email);
