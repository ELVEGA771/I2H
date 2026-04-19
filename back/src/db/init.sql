-- ============================================================
-- Deuna Rewards - Schema
-- ============================================================

CREATE TABLE IF NOT EXISTS merchants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  image_url VARCHAR(255),
  is_featured BOOLEAN DEFAULT false,
  sponsor_level VARCHAR(20) DEFAULT 'none', -- none, basic, premium
  loyalty_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loyalty_programs (
  id SERIAL PRIMARY KEY,
  merchant_id INT REFERENCES merchants(id) ON DELETE CASCADE,
  campaign_name VARCHAR(100) NOT NULL DEFAULT 'Programa Rewards',
  points_per_dollar INT NOT NULL DEFAULT 1,
  reward_threshold INT NOT NULL DEFAULT 10,
  reward_type VARCHAR(30) NOT NULL, -- discount, free_product, percentage_off
  reward_value VARCHAR(100) NOT NULL,
  terms TEXT NOT NULL DEFAULT 'Valido para compras presenciales. Reward de un solo uso.',
  business_category VARCHAR(60) NOT NULL DEFAULT 'Cafeteria',
  reward_tiers JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE loyalty_programs
  ADD COLUMN IF NOT EXISTS campaign_name VARCHAR(100) NOT NULL DEFAULT 'Programa Rewards',
  ADD COLUMN IF NOT EXISTS terms TEXT NOT NULL DEFAULT 'Valido para compras presenciales. Reward de un solo uso.',
  ADD COLUMN IF NOT EXISTS business_category VARCHAR(60) NOT NULL DEFAULT 'Cafeteria',
  ADD COLUMN IF NOT EXISTS reward_tiers JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  merchant_id INT REFERENCES merchants(id),
  amount NUMERIC(10,2) NOT NULL,
  points_earned INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_points (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  merchant_id INT REFERENCES merchants(id),
  points_balance INT NOT NULL DEFAULT 0,
  total_points_earned INT NOT NULL DEFAULT 0,
  UNIQUE(user_id, merchant_id)
);

CREATE TABLE IF NOT EXISTS rewards (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  merchant_id INT REFERENCES merchants(id),
  loyalty_program_id INT REFERENCES loyalty_programs(id),
  tier_id VARCHAR(100),
  reward_title VARCHAR(150),
  points_spent INT NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'unlocked', -- unlocked, redeemed, expired
  qr_code VARCHAR(255) UNIQUE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  redeemed_at TIMESTAMPTZ
);

ALTER TABLE rewards
  ADD COLUMN IF NOT EXISTS tier_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS reward_title VARCHAR(150),
  ADD COLUMN IF NOT EXISTS points_spent INT NOT NULL DEFAULT 0;

-- Normalize old demo rows that were inserted with mojibake before this migration.
UPDATE merchants SET name = 'Cafetería Luna', category = 'Cafetería', description = 'El mejor café del barrio', loyalty_enabled = true WHERE id = 1;
UPDATE merchants SET name = 'Barber Shop Centro', category = 'Barbería', description = 'Cortes modernos y clásicos', loyalty_enabled = true WHERE id = 2;
UPDATE merchants SET name = 'Panadería El Sol', category = 'Panadería', description = 'Pan artesanal horneado cada día', loyalty_enabled = true WHERE id = 3;
UPDATE users SET name = 'Ana García' WHERE id = 1;
UPDATE users SET name = 'Luis Martínez' WHERE id = 2;
UPDATE users SET name = 'María Torres' WHERE id = 3;
UPDATE loyalty_programs
SET campaign_name = 'Cafe Lovers',
    reward_value = '$1 de descuento en tu próxima compra',
    terms = 'Válido en compras desde $3. Un reward por compra.',
    updated_at = NOW()
WHERE merchant_id = 1
  AND campaign_name = 'Programa Rewards';
UPDATE loyalty_programs
SET campaign_name = 'Cortes Frecuentes',
    terms = 'Válido de lunes a jueves con reserva previa.',
    updated_at = NOW()
WHERE merchant_id = 2
  AND campaign_name = 'Programa Rewards';
UPDATE loyalty_programs
SET campaign_name = 'Pan de Cada Día',
    terms = 'No acumulable con otras promociones.',
    updated_at = NOW()
WHERE merchant_id = 3
  AND campaign_name = 'Programa Rewards';
UPDATE loyalty_programs
SET campaign_name = 'Vecino Frecuente',
    terms = 'Válido para compras presenciales.',
    updated_at = NOW()
WHERE merchant_id = 5
  AND campaign_name = 'Programa Rewards';

-- ============================================================
-- Seed data
-- ============================================================

INSERT INTO merchants (name, category, description, image_url, is_featured, sponsor_level, loyalty_enabled)
  SELECT 'Cafetería Luna', 'Cafetería', 'El mejor café del barrio', '/imagenes/cafeteria.png', true, 'premium', true
  WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE name = 'Cafetería Luna')
UNION ALL
  SELECT 'Barber Shop Centro', 'Barbería', 'Cortes modernos y clásicos', '/imagenes/barber.png', true, 'basic', true
  WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE name = 'Barber Shop Centro')
UNION ALL
  SELECT 'Panadería El Sol', 'Panadería', 'Pan artesanal horneado cada día', '/imagenes/panaderia.png', false, 'none', true
  WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE name = 'Panadería El Sol')
UNION ALL
  SELECT 'Farmacia Salud', 'Farmacia', 'Medicamentos y productos de salud', '/imagenes/farmacia.png', false, 'none', false
  WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE name = 'Farmacia Salud')
UNION ALL
  SELECT 'Tienda Don Jorge', 'Minimarket', 'Todo lo que necesitas cerca', '/imagenes/tienda.png', true, 'basic', true
  WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE name = 'Tienda Don Jorge');

WITH ranked_merchants AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY name ORDER BY id) AS row_number
  FROM merchants
)
UPDATE merchants m
SET loyalty_enabled = false,
    sponsor_level = 'none',
    is_featured = false
FROM ranked_merchants rm
WHERE m.id = rm.id
  AND rm.row_number > 1;

INSERT INTO loyalty_programs (merchant_id, campaign_name, points_per_dollar, reward_threshold, reward_type, reward_value, terms)
  SELECT 1, 'Cafe Lovers', 1, 10, 'discount', '$1 de descuento en tu próxima compra', 'Válido en compras desde $3. Un reward por compra.'
  WHERE NOT EXISTS (SELECT 1 FROM loyalty_programs WHERE merchant_id = 1)
UNION ALL
  SELECT 2, 'Cortes Frecuentes', 1, 20, 'free_product', 'Corte gratis', 'Válido de lunes a jueves con reserva previa.'
  WHERE NOT EXISTS (SELECT 1 FROM loyalty_programs WHERE merchant_id = 2)
UNION ALL
  SELECT 3, 'Pan de Cada Día', 1, 15, 'percentage_off', '20% de descuento en toda la tienda', 'No acumulable con otras promociones.'
  WHERE NOT EXISTS (SELECT 1 FROM loyalty_programs WHERE merchant_id = 3)
UNION ALL
  SELECT 5, 'Vecino Frecuente', 1, 30, 'discount', '$3 de descuento en compras mayores a $10', 'Válido para compras presenciales.'
  WHERE NOT EXISTS (SELECT 1 FROM loyalty_programs WHERE merchant_id = 5);

UPDATE loyalty_programs
SET points_per_dollar = 100,
    reward_threshold = CASE WHEN reward_threshold < 100 THEN reward_threshold * 100 ELSE reward_threshold END,
    business_category = CASE
      WHEN merchant_id = 2 THEN 'Peluqueria/Barberia'
      WHEN merchant_id = 3 THEN 'Panaderia'
      WHEN merchant_id = 5 THEN 'Tienda'
      ELSE 'Cafeteria'
    END,
    reward_tiers = CASE
      WHEN merchant_id = 1 THEN '[{"id":"cafe-500","points":500,"title":"Cafe gratis"},{"id":"cafe-1000","points":1000,"title":"Combo desayuno"},{"id":"cafe-2000","points":2000,"title":"Postre gratis"}]'::jsonb
      WHEN merchant_id = 2 THEN '[{"id":"barber-500","points":500,"title":"Lavado de pelo gratis"},{"id":"barber-1000","points":1000,"title":"Corte gratis"},{"id":"barber-2000","points":2000,"title":"Producto de belleza gratis"}]'::jsonb
      WHEN merchant_id = 3 THEN '[{"id":"pan-500","points":500,"title":"Pan dulce gratis"},{"id":"pan-1000","points":1000,"title":"20% de descuento"},{"id":"pan-2000","points":2000,"title":"Combo familiar"}]'::jsonb
      WHEN merchant_id = 5 THEN '[{"id":"tienda-500","points":500,"title":"Snack gratis"},{"id":"tienda-1000","points":1000,"title":"$3 de descuento"},{"id":"tienda-2000","points":2000,"title":"Canasta basica mini"}]'::jsonb
      ELSE reward_tiers
    END,
    updated_at = NOW()
WHERE reward_tiers = '[]'::jsonb OR points_per_dollar <> 100 OR reward_threshold < 100;

UPDATE loyalty_programs
SET reward_threshold = COALESCE((reward_tiers->0->>'points')::INT, reward_threshold),
    reward_value = COALESCE(NULLIF(reward_tiers->0->>'title', ''), reward_value),
    updated_at = NOW()
WHERE jsonb_array_length(reward_tiers) > 0;

WITH ranked_programs AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY merchant_id ORDER BY active DESC, created_at DESC, id DESC) AS row_number
  FROM loyalty_programs
)
UPDATE loyalty_programs lp
SET active = false,
    updated_at = NOW()
FROM ranked_programs rp
WHERE lp.id = rp.id
  AND rp.row_number > 1
  AND lp.active = true;

INSERT INTO users (name, phone)
  SELECT 'Ana García', '0991234567'
  WHERE NOT EXISTS (SELECT 1 FROM users WHERE phone = '0991234567')
UNION ALL
  SELECT 'Luis Martínez', '0997654321'
  WHERE NOT EXISTS (SELECT 1 FROM users WHERE phone = '0997654321')
UNION ALL
  SELECT 'María Torres', '0993456789'
  WHERE NOT EXISTS (SELECT 1 FROM users WHERE phone = '0993456789');

-- Ana tiene 8 puntos en Cafetería Luna (cerca de desbloquear)
INSERT INTO user_points (user_id, merchant_id, points_balance, total_points_earned) VALUES
  (1, 1, 800,  800),
  (1, 2, 500,  500),
  (2, 1, 1000, 1000),
  (2, 3, 300,  300),
  (3, 5, 1800, 1800)
ON CONFLICT (user_id, merchant_id) DO UPDATE
  SET points_balance = EXCLUDED.points_balance,
      total_points_earned = EXCLUDED.total_points_earned;

-- Luis ya desbloqueó reward en Cafetería Luna
INSERT INTO rewards (user_id, merchant_id, loyalty_program_id, status, qr_code)
  SELECT 2, 1, lp.id, 'unlocked', 'QR-REWARD-2-1-DEMO'
  FROM loyalty_programs lp
  WHERE lp.merchant_id = 1
    AND lp.active = true
    AND NOT EXISTS (SELECT 1 FROM rewards WHERE qr_code = 'QR-REWARD-2-1-DEMO')
  ORDER BY lp.created_at DESC, lp.id DESC
  LIMIT 1;

-- Simular algunas transacciones históricas
INSERT INTO transactions (user_id, merchant_id, amount, points_earned)
  SELECT 1, 1, 5.00,  5 WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE user_id = 1 AND merchant_id = 1 AND amount = 5.00 AND points_earned = 5)
UNION ALL
  SELECT 1, 1, 3.00,  3 WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE user_id = 1 AND merchant_id = 1 AND amount = 3.00 AND points_earned = 3)
UNION ALL
  SELECT 1, 2, 5.00,  5 WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE user_id = 1 AND merchant_id = 2 AND amount = 5.00 AND points_earned = 5)
UNION ALL
  SELECT 2, 1, 10.00, 10 WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE user_id = 2 AND merchant_id = 1 AND amount = 10.00 AND points_earned = 10)
UNION ALL
  SELECT 2, 3, 3.00,  3 WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE user_id = 2 AND merchant_id = 3 AND amount = 3.00 AND points_earned = 3)
UNION ALL
  SELECT 3, 5, 18.00, 18 WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE user_id = 3 AND merchant_id = 5 AND amount = 18.00 AND points_earned = 18);
