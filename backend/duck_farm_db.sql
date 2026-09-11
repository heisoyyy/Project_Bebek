-- ========================================================
-- DATABASE SCRIPT FOR SISTEM KANDANG BEBEK
-- File: duck_farm_db.sql
-- Keterangan: Script ini akan DROP database lama dan membuat
--             Database duck_farm_db yang bersih (data transaksi kosong).
-- ========================================================

DROP DATABASE IF EXISTS duck_farm_db;
CREATE DATABASE duck_farm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE duck_farm_db;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Tabel Kandang Bebek (Coops)
DROP TABLE IF EXISTS coops;
CREATE TABLE coops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL DEFAULT 'Kandang Bebek Utama',
  current_ducks INT NOT NULL DEFAULT 526,
  capacity INT NOT NULL DEFAULT 600,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Tabel Log Perubahan Populasi Bebek
DROP TABLE IF EXISTS duck_population_logs;
CREATE TABLE duck_population_logs (
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

-- 3. Tabel Produksi Telur H-1
DROP TABLE IF EXISTS egg_productions;
CREATE TABLE egg_productions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  production_date DATE UNIQUE NOT NULL,
  good_eggs INT NOT NULL DEFAULT 0,
  cracked_eggs INT NOT NULL DEFAULT 0,
  total_eggs INT NOT NULL DEFAULT 0,
  duck_population INT NOT NULL DEFAULT 526,
  productivity_pct DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Tabel Stok Telur Gudang & Penjualan
DROP TABLE IF EXISTS egg_inventory;
CREATE TABLE egg_inventory (
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

-- 5. Tabel Item Pakan
DROP TABLE IF EXISTS feed_items;
CREATE TABLE feed_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  stock_kg DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  min_stock_alert_kg DECIMAL(10,2) DEFAULT 30.00,
  unit_type VARCHAR(20) DEFAULT 'karung_50kg',
  price_per_kg DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 6. Tabel Pembelian Pakan
DROP TABLE IF EXISTS feed_purchases;
CREATE TABLE feed_purchases (
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
  FOREIGN KEY (feed_item_id) REFERENCES feed_items(id) ON DELETE CASCADE
);

-- 7. Tabel Pemakaian Pakan
DROP TABLE IF EXISTS feed_usages;
CREATE TABLE feed_usages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usage_date DATE NOT NULL,
  coop_id INT DEFAULT 1,
  feed_item_id INT NOT NULL,
  quantity_kg DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (feed_item_id) REFERENCES feed_items(id) ON DELETE CASCADE
);

-- 8. Tabel Transaksi Keuangan
DROP TABLE IF EXISTS financial_transactions;
CREATE TABLE financial_transactions (
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

-- 9. Tabel Pengaturan Sistem
DROP TABLE IF EXISTS settings;
CREATE TABLE settings (
  setting_key VARCHAR(50) PRIMARY KEY,
  setting_value TEXT NOT NULL,
  description VARCHAR(255)
);

SET FOREIGN_KEY_CHECKS = 1;

-- ========================================================
-- DATA AWAL BASE (SEED INITIAL DATA)
-- ========================================================

-- 1. Kandang Utama (526 Ekor Bebek)
INSERT INTO coops (id, name, current_ducks, capacity, status) VALUES 
(1, 'Kandang Bebek Utama', 526, 600, 'active');

-- 2. Item Pakan (Hanya Vitamin dan Pakan Mix, Stok = 0)
INSERT INTO feed_items (id, name, stock_kg, min_stock_alert_kg, unit_type, price_per_kg) VALUES
(1, 'Vitamin', 0.00, 10.00, 'botol / kg', 15000.00),
(2, 'Pakan Mix', 0.00, 30.00, 'karung_50kg', 7500.00);

-- 3. Pengaturan Default
INSERT INTO settings (setting_key, setting_value, description) VALUES
('egg_price_per_piece', '2200', 'Harga jual telur per butir (Rp)'),
('egg_price_per_trai', '66000', 'Harga jual telur per trai / 30 butir (Rp)'),
('min_feed_alert_days', '3', 'Batas minimum estimasi hari sisa pakan untuk notifikasi'),
('production_alert_threshold', '10', 'Batas persentase perubahan produksi telur untuk notifikasi (%)');
