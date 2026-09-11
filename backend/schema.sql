-- Schema untuk duck_farm_db (database sudah dibuat sebelumnya)

-- 1. Kandang (Single Coop)
CREATE TABLE IF NOT EXISTS coops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  current_ducks INT NOT NULL DEFAULT 526,
  capacity INT NOT NULL DEFAULT 600,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Log Perubahan Populasi Bebek
CREATE TABLE IF NOT EXISTS duck_population_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  coop_id INT NOT NULL DEFAULT 1,
  log_date DATE NOT NULL,
  change_type ENUM('add', 'subtract') NOT NULL,
  quantity INT NOT NULL,
  reason VARCHAR(100) NOT NULL,
  population_after INT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coop_id) REFERENCES coops(id) ON DELETE CASCADE
);

-- 3. Produksi Telur (H-1)
CREATE TABLE IF NOT EXISTS egg_productions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  production_date DATE UNIQUE NOT NULL,
  good_eggs INT NOT NULL DEFAULT 0,
  cracked_eggs INT NOT NULL DEFAULT 0,
  total_eggs INT NOT NULL DEFAULT 0,
  duck_population INT NOT NULL DEFAULT 526,
  productivity_pct DECIMAL(5,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Stok Telur Gudang & Penjualan
CREATE TABLE IF NOT EXISTS egg_inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  record_date DATE NOT NULL,
  initial_stock_butir INT NOT NULL DEFAULT 0,
  added_production_butir INT NOT NULL DEFAULT 0,
  sold_butir INT NOT NULL DEFAULT 0,
  damaged_butir INT NOT NULL DEFAULT 0,
  consumed_butir INT NOT NULL DEFAULT 0,
  final_stock_butir INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Item Pakan
CREATE TABLE IF NOT EXISTS feed_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  stock_kg DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  min_stock_alert_kg DECIMAL(10,2) DEFAULT 30.00,
  unit_type VARCHAR(20) DEFAULT 'karung_50kg',
  price_per_kg DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 6. Pembelian Pakan (With Payment Status)
CREATE TABLE IF NOT EXISTS feed_purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_date DATE NOT NULL,
  feed_item_id INT NOT NULL,
  quantity_kg DECIMAL(10,2) NOT NULL,
  price_per_kg DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  payment_status ENUM('unpaid', 'lunas') NOT NULL DEFAULT 'lunas',
  supplier VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (feed_item_id) REFERENCES feed_items(id)
);

-- 7. Pemakaian Pakan
CREATE TABLE IF NOT EXISTS feed_usages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usage_date DATE NOT NULL,
  coop_id INT DEFAULT 1,
  feed_item_id INT NOT NULL,
  quantity_kg DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (feed_item_id) REFERENCES feed_items(id)
);

-- 8. Transaksi Keuangan
CREATE TABLE IF NOT EXISTS financial_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_date DATE NOT NULL,
  type ENUM('income', 'expense') NOT NULL,
  category VARCHAR(50) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  reference_type VARCHAR(50),
  reference_id INT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Pengaturan Sistem
CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(50) PRIMARY KEY,
  setting_value TEXT NOT NULL,
  description VARCHAR(255)
);
