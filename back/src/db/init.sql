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
  points_per_dollar INT NOT NULL DEFAULT 1,
  reward_threshold INT NOT NULL DEFAULT 10,
  reward_type VARCHAR(30) NOT NULL, -- discount, free_product, percentage_off
  reward_value VARCHAR(100) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
  status VARCHAR(20) DEFAULT 'unlocked', -- unlocked, redeemed, expired
  qr_code VARCHAR(255) UNIQUE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  redeemed_at TIMESTAMPTZ
);

-- ============================================================
-- Seed data
-- ============================================================

INSERT INTO merchants (name, category, description, image_url, is_featured, sponsor_level, loyalty_enabled) VALUES
  ('Cafetería Luna',     'Cafetería',   'El mejor café del barrio',          '/imagenes/cafeteria.png',  true,  'premium', true),
  ('Barber Shop Centro', 'Barbería',    'Cortes modernos y clásicos',        '/imagenes/barber.png',     true,  'basic',   true),
  ('Panadería El Sol',   'Panadería',   'Pan artesanal horneado cada día',   '/imagenes/panaderia.png',  false, 'none',    true),
  ('Farmacia Salud',     'Farmacia',    'Medicamentos y productos de salud', '/imagenes/farmacia.png',   false, 'none',    false),
  ('Tienda Don Jorge',   'Minimarket',  'Todo lo que necesitas cerca',       '/imagenes/tienda.png',     true,  'basic',   true)
ON CONFLICT DO NOTHING;

INSERT INTO loyalty_programs (merchant_id, points_per_dollar, reward_threshold, reward_type, reward_value) VALUES
  (1, 1, 10, 'discount',        '$1 de descuento en tu próxima compra'),
  (2, 1, 20, 'free_product',    'Corte gratis'),
  (3, 1, 15, 'percentage_off',  '20% de descuento en toda la tienda'),
  (5, 1, 30, 'discount',        '$3 de descuento en compras mayores a $10')
ON CONFLICT DO NOTHING;

INSERT INTO users (name, phone) VALUES
  ('Ana García',   '0991234567'),
  ('Luis Martínez','0997654321'),
  ('María Torres', '0993456789')
ON CONFLICT DO NOTHING;

-- Ana tiene 8 puntos en Cafetería Luna (cerca de desbloquear)
INSERT INTO user_points (user_id, merchant_id, points_balance, total_points_earned) VALUES
  (1, 1, 8,  8),
  (1, 2, 5,  5),
  (2, 1, 10, 10),
  (2, 3, 3,  3),
  (3, 5, 18, 18)
ON CONFLICT (user_id, merchant_id) DO UPDATE
  SET points_balance = EXCLUDED.points_balance,
      total_points_earned = EXCLUDED.total_points_earned;

-- Luis ya desbloqueó reward en Cafetería Luna
INSERT INTO rewards (user_id, merchant_id, loyalty_program_id, status, qr_code)
  SELECT 2, 1, 1, 'unlocked', 'QR-REWARD-2-1-DEMO'
  WHERE NOT EXISTS (SELECT 1 FROM rewards WHERE qr_code = 'QR-REWARD-2-1-DEMO');

-- Simular algunas transacciones históricas
INSERT INTO transactions (user_id, merchant_id, amount, points_earned) VALUES
  (1, 1, 5.00,  5),
  (1, 1, 3.00,  3),
  (1, 2, 5.00,  5),
  (2, 1, 10.00, 10),
  (2, 3, 3.00,  3),
  (3, 5, 18.00, 18)
ON CONFLICT DO NOTHING;
