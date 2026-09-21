/**
 * Exporta el snapshot JSON de CriptoMundo a SQL para PostgreSQL.
 * No requiere ninguna dependencia npm: genera un .sql que se aplica con psql.
 *
 *   node exportar-a-postgres.js criptomundo-data.json > carga.sql
 *   psql "$DATABASE_URL" -f migrations/001_init.sql
 *   psql "$DATABASE_URL" -f carga.sql
 */
const fs = require('fs')

const file = process.argv[2] || './criptomundo-data.json'
if (!fs.existsSync(file)) { console.error(`No existe ${file}`); process.exit(1) }
const d = JSON.parse(fs.readFileSync(file, 'utf8'))

const q = v => v === null || v === undefined ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`
const j = v => `'${JSON.stringify(v ?? {}).replace(/'/g, "''")}'::jsonb`
const out = []

out.push('BEGIN;')
out.push('-- Generado por exportar-a-postgres.js. Aplicar DESPUÉS de migrations/001_init.sql')

// Plantillas de objeto (embebidas en el servidor, se vuelcan aquí para tener FK válidas)
const templates = new Set()
for (const p of Object.values(d.players || {})) for (const i of p.character.inventory || []) templates.add(i.itemId)
for (const l of d.marketListings || []) templates.add(l.itemId)
for (const t of templates) {
  out.push(`INSERT INTO item_templates (item_id, name, type, rarity, base_value) VALUES (${q(t)}, ${q(t)}, 'MATERIAL', 'COMMON', 0) ON CONFLICT DO NOTHING;`)
}

for (const [username, p] of Object.entries(d.players || {})) {
  const c = p.character
  const pw = `${p.password.algo}$${p.password.N}$${p.password.salt}$${p.password.hash}`
  out.push(`INSERT INTO users (username, email, password_hash, created_at) VALUES (${q(username)}, ${q(p.email)}, ${q(pw)}, ${q(p.createdAt)}) ON CONFLICT (username) DO NOTHING;`)
  out.push(`INSERT INTO characters (user_id, name, class, level, xp, hp, max_hp, mp, max_mp, strength, intelligence, agility, defense, gold, cgrid, pvp_rating)
 SELECT id, ${q(c.name)}, ${q(c.class)}, ${c.level}, ${c.xp}, ${c.hp}, ${c.maxHp}, ${c.mp}, ${c.maxMp}, ${c.strength}, ${c.intelligence}, ${c.agility}, ${c.defense}, ${c.gold}, ${c.cgrid || 0}, ${c.pvpRating || 1200}
 FROM users WHERE username = ${q(username)} ON CONFLICT (name) DO NOTHING;`)
  for (const it of c.inventory || []) {
    out.push(`INSERT INTO items (item_id, owner_id, quantity) SELECT ${q(it.itemId)}, id, ${it.quantity} FROM characters WHERE name = ${q(c.name)};`)
  }
  for (const aq of c.activeQuests || []) {
    out.push(`INSERT INTO quest_progress (character_id, quest_id, status, progress) SELECT id, ${q(aq.questId)}, 'ACTIVE', ${j(aq.objectiveProgress)} FROM characters WHERE name = ${q(c.name)} ON CONFLICT DO NOTHING;`)
  }
  for (const qid of c.completedQuests || []) {
    out.push(`INSERT INTO quest_progress (character_id, quest_id, status, progress) SELECT id, ${q(qid)}, 'COMPLETED', '{}'::jsonb FROM characters WHERE name = ${q(c.name)} ON CONFLICT DO NOTHING;`)
  }
  for (const [k, v] of Object.entries(c.questCounters || {})) {
    out.push(`INSERT INTO quest_counters (character_id, key, value) SELECT id, ${q(k)}, ${v} FROM characters WHERE name = ${q(c.name)} ON CONFLICT DO NOTHING;`)
  }
}

for (const g of Object.values(d.guilds || {})) {
  out.push(`INSERT INTO guilds (name, tag, emblem, description, level, xp, max_members, treasury_gold, treasury_cgrid) VALUES (${q(g.name)}, ${q(g.tag)}, ${q(g.emblem)}, ${q(g.desc)}, ${g.level}, ${g.xp || 0}, ${g.maxMembers}, ${g.treasury?.gold || 0}, ${g.treasury?.cgrid || 0}) ON CONFLICT (name) DO NOTHING;`)
  for (const m of g.members || []) {
    out.push(`INSERT INTO guild_members (guild_id, character_id, role) SELECT gu.id, ch.id, ${q(m.role)} FROM guilds gu, characters ch WHERE gu.name = ${q(g.name)} AND ch.name = ${q(m.name)} ON CONFLICT DO NOTHING;`)
  }
}

for (const l of (d.marketListings || []).filter(x => x.status === 'ACTIVE' && !x.npc)) {
  out.push(`INSERT INTO market_listings (seller_id, item_id, quantity, price_per_unit, status, expires_at) SELECT id, ${q(l.itemId)}, ${l.quantity}, ${l.pricePerUnit}, 'ACTIVE', ${q(l.expiresAt)} FROM characters WHERE name = ${q(l.seller?.name)};`)
}
for (const t of (d.marketTransactions || []).slice(-1000)) {
  out.push(`INSERT INTO market_transactions (listing_id, item_id, quantity, unit_price, total, fee, created_at) VALUES (gen_random_uuid(), ${q(t.itemId)}, ${t.quantity}, ${t.unitPrice}, ${t.total}, ${t.fee || 0}, ${q(t.at)});`)
}
for (const a of (d.auditLog || []).slice(-5000)) {
  out.push(`INSERT INTO audit_logs (actor, type, data, created_at) VALUES (${q(a.actor)}, ${q(a.type)}, ${j(a.data)}, ${q(a.at)});`)
}

out.push('COMMIT;')
console.log(out.join('\n'))
console.error(`-- ${out.length} sentencias generadas desde ${file}`)
