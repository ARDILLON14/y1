-- CriptoMundo — Esquema inicial PostgreSQL (Fase 2 del plan)
-- Ejecutar:  psql "$DATABASE_URL" -f migrations/001_init.sql

BEGIN;

CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL CHECK (char_length(username) BETWEEN 3 AND 20),
  email         CITEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,           -- scrypt/argon2id: algo$params$salt$hash
  role          TEXT NOT NULL DEFAULT 'player',
  muted_until   TIMESTAMPTZ,
  banned        BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  token_hash  TEXT PRIMARY KEY,          -- guardar HASH del token, no el token
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip          INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL
);
CREATE INDEX ON sessions (user_id);
CREATE INDEX ON sessions (expires_at);

CREATE TABLE characters (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT UNIQUE NOT NULL,
  class         TEXT NOT NULL,
  level         INT NOT NULL DEFAULT 1 CHECK (level > 0),
  xp            BIGINT NOT NULL DEFAULT 0 CHECK (xp >= 0),
  hp            INT NOT NULL, max_hp INT NOT NULL,
  mp            INT NOT NULL, max_mp INT NOT NULL,
  strength      INT NOT NULL, intelligence INT NOT NULL, agility INT NOT NULL, defense INT NOT NULL,
  gold          BIGINT NOT NULL DEFAULT 0 CHECK (gold >= 0),
  cgrid         BIGINT NOT NULL DEFAULT 0 CHECK (cgrid >= 0),
  pvp_rating    INT NOT NULL DEFAULT 1200,
  guild_id      BIGINT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON characters (user_id);
CREATE INDEX ON characters (level DESC);

CREATE TABLE item_templates (
  item_id   TEXT PRIMARY KEY,
  name      TEXT NOT NULL, icon TEXT, type TEXT NOT NULL,
  rarity    TEXT NOT NULL CHECK (rarity IN ('COMMON','UNCOMMON','RARE','EPIC','LEGENDARY','MYTHIC')),
  slot      TEXT, base_value INT NOT NULL DEFAULT 0,
  tradeable BOOLEAN NOT NULL DEFAULT true,
  stats     JSONB NOT NULL DEFAULT '{}'
);

-- Cada objeto tiene identidad propia: base para ERC-1155/721 más adelante
CREATE TABLE items (
  uid         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id     TEXT NOT NULL REFERENCES item_templates(item_id),
  owner_id    BIGINT REFERENCES characters(id) ON DELETE CASCADE,
  quantity    INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  bound       BOOLEAN NOT NULL DEFAULT false,
  affixes     JSONB NOT NULL DEFAULT '{}',
  escrow_ref  TEXT,                     -- listing id cuando está en el mercado
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON items (owner_id);
CREATE INDEX ON items (item_id);

CREATE TABLE equipment (
  character_id BIGINT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  slot         TEXT NOT NULL,
  item_uid     UUID NOT NULL REFERENCES items(uid) ON DELETE CASCADE,
  PRIMARY KEY (character_id, slot)
);

CREATE TABLE quest_progress (
  character_id BIGINT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  quest_id     TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'ACTIVE',
  progress     JSONB NOT NULL DEFAULT '{}',
  started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (character_id, quest_id)
);
CREATE TABLE quest_counters (
  character_id BIGINT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  key          TEXT NOT NULL,
  value        BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (character_id, key)
);

CREATE TABLE battle_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id BIGINT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  monster_id   TEXT NOT NULL,
  enemy_hp     INT NOT NULL, enemy_max_hp INT NOT NULL,
  state        TEXT NOT NULL DEFAULT 'ACTIVE',
  seed         TEXT NOT NULL,
  turn         INT NOT NULL DEFAULT 0,
  buffs        JSONB NOT NULL DEFAULT '[]',
  started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON battle_sessions (character_id, state);

CREATE TABLE dungeon_runs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dungeon_id   TEXT NOT NULL,
  leader_id    BIGINT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  party        JSONB NOT NULL DEFAULT '[]',
  seed         TEXT NOT NULL,
  floor        INT NOT NULL DEFAULT 0,
  state        TEXT NOT NULL DEFAULT 'ACTIVE',
  rewarded     BOOLEAN NOT NULL DEFAULT false,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at  TIMESTAMPTZ
);
CREATE UNIQUE INDEX one_active_run ON dungeon_runs (leader_id) WHERE state = 'ACTIVE';

CREATE TABLE pvp_matches (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_a   BIGINT NOT NULL REFERENCES characters(id),
  player_b   BIGINT REFERENCES characters(id),
  seed       TEXT NOT NULL,
  winner     BIGINT REFERENCES characters(id),
  rating_delta INT,
  season     INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE guilds (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT UNIQUE NOT NULL,
  tag         TEXT, emblem TEXT, description TEXT,
  level       INT NOT NULL DEFAULT 1,
  xp          BIGINT NOT NULL DEFAULT 0,
  max_members INT NOT NULL DEFAULT 20,
  treasury_gold  BIGINT NOT NULL DEFAULT 0 CHECK (treasury_gold >= 0),
  treasury_cgrid BIGINT NOT NULL DEFAULT 0 CHECK (treasury_cgrid >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE guild_members (
  guild_id     BIGINT NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  character_id BIGINT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('LEADER','OFFICER','MEMBER')),
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (guild_id, character_id)
);
CREATE UNIQUE INDEX one_guild_per_char ON guild_members (character_id);

CREATE TABLE market_listings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id      BIGINT REFERENCES characters(id) ON DELETE SET NULL,
  item_id        TEXT NOT NULL REFERENCES item_templates(item_id),
  item_uid       UUID REFERENCES items(uid),
  quantity       INT NOT NULL CHECK (quantity > 0),
  price_per_unit BIGINT NOT NULL CHECK (price_per_unit > 0),
  currency       TEXT NOT NULL DEFAULT 'gold',
  status         TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at     TIMESTAMPTZ NOT NULL
);
CREATE INDEX ON market_listings (status, item_id);

CREATE TABLE market_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  UUID NOT NULL,
  buyer_id    BIGINT REFERENCES characters(id),
  seller_id   BIGINT REFERENCES characters(id),
  item_id     TEXT NOT NULL,
  quantity    INT NOT NULL,
  unit_price  BIGINT NOT NULL,
  total       BIGINT NOT NULL,
  fee         BIGINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE chat_messages (
  id           BIGSERIAL PRIMARY KEY,
  character_id BIGINT REFERENCES characters(id) ON DELETE SET NULL,
  channel      TEXT NOT NULL DEFAULT 'global',
  message      TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON chat_messages (channel, created_at DESC);

-- Economía: TODO movimiento de moneda deja rastro
CREATE TABLE token_transactions (
  id           BIGSERIAL PRIMARY KEY,
  character_id BIGINT REFERENCES characters(id) ON DELETE SET NULL,
  currency     TEXT NOT NULL CHECK (currency IN ('gold','cgrid')),
  amount       BIGINT NOT NULL,          -- positivo = faucet, negativo = sink
  reason       TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON token_transactions (character_id, created_at DESC);
CREATE INDEX ON token_transactions (reason);

CREATE TABLE audit_logs (
  id         BIGSERIAL PRIMARY KEY,
  actor      TEXT,
  type       TEXT NOT NULL,
  data       JSONB NOT NULL DEFAULT '{}',
  ip         INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON audit_logs (type, created_at DESC);

CREATE TABLE idempotency_keys (
  key        TEXT PRIMARY KEY,
  user_id    BIGINT REFERENCES users(id) ON DELETE CASCADE,
  response   JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Web3 (fase 9): vacías hasta que exista despliegue real en testnet
CREATE TABLE wallets (
  character_id BIGINT PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
  address      TEXT UNIQUE NOT NULL,
  verified_at  TIMESTAMPTZ,
  nonce        TEXT
);
CREATE TABLE blockchain_transactions (
  id           BIGSERIAL PRIMARY KEY,
  character_id BIGINT REFERENCES characters(id) ON DELETE SET NULL,
  chain_id     INT NOT NULL,
  tx_hash      TEXT UNIQUE NOT NULL,
  kind         TEXT NOT NULL,           -- mint | burn | transfer | list | buy
  status       TEXT NOT NULL DEFAULT 'PENDING',
  payload      JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE nft_items (
  id           BIGSERIAL PRIMARY KEY,
  item_uid     UUID UNIQUE REFERENCES items(uid) ON DELETE SET NULL,
  standard     TEXT NOT NULL CHECK (standard IN ('ERC1155','ERC721')),
  contract     TEXT NOT NULL,
  token_id     NUMERIC NOT NULL,
  minted_at    TIMESTAMPTZ
);

COMMIT;
