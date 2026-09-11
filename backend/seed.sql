USE duck_farm_db;

-- 1. Reset all transaction and log tables (empty data)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE duck_population_logs;
TRUNCATE TABLE egg_productions;
TRUNCATE TABLE egg_inventory;
TRUNCATE TABLE feed_purchases;
TRUNCATE TABLE feed_usages;
TRUNCATE TABLE financial_transactions;
TRUNCATE TABLE feed_items;
SET FOREIGN_KEY_CHECKS = 1;

-- 2. Reset Single Coop (526 Ducks)
DELETE FROM coops WHERE id > 1;
INSERT INTO coops (id, name, current_ducks, capacity, status) VALUES 
(1, 'Kandang Bebek Utama', 526, 600, 'active')
ON DUPLICATE KEY UPDATE current_ducks = 526, name = 'Kandang Bebek Utama';

-- 3. Reset Feed Items (Only Vitamin & Pakan Mix, Stock set to 0.00)
INSERT INTO feed_items (id, name, stock_kg, min_stock_alert_kg, unit_type, price_per_kg) VALUES
(1, 'Vitamin', 0.00, 10.00, 'botol / kg', 15000.00),
(2, 'Pakan Mix', 0.00, 30.00, 'karung_50kg', 7500.00);

-- 4. Initial Settings Defaults
INSERT INTO settings (setting_key, setting_value, description) VALUES
('egg_price_per_piece', '2200', 'Harga jual telur per butir (Rp)'),
('egg_price_per_trai', '66000', 'Harga jual telur per trai / 30 butir (Rp)'),
('min_feed_alert_days', '3', 'Batas minimum estimasi hari sisa pakan untuk notifikasi'),
('production_alert_threshold', '10', 'Batas persentase perubahan produksi telur untuk notifikasi (%)')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
