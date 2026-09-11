const mongoose = require('mongoose');

// ─── Coop ───────────────────────────────────────────────
const CoopSchema = new mongoose.Schema({
  _id: Number,
  name: { type: String, required: true },
  current_ducks: { type: Number, default: 526 },
  capacity: { type: Number, default: 600 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// ─── Duck Population Logs ───────────────────────────────
const DuckPopulationLogSchema = new mongoose.Schema({
  coop_id: { type: Number, default: 1 },
  log_date: { type: Date, required: true },
  change_type: { type: String, enum: ['add', 'subtract'], required: true },
  quantity: { type: Number, required: true },
  reason: { type: String, required: true },
  population_after: { type: Number, required: true },
  notes: String,
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

// ─── Egg Production ─────────────────────────────────────
const EggProductionSchema = new mongoose.Schema({
  production_date: { type: Date, required: true, unique: true },
  good_eggs: { type: Number, default: 0 },
  cracked_eggs: { type: Number, default: 0 },
  total_eggs: { type: Number, default: 0 },
  duck_population: { type: Number, default: 526 },
  productivity_pct: { type: Number, required: true },
  notes: String,
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// ─── Egg Inventory ──────────────────────────────────────
const EggInventorySchema = new mongoose.Schema({
  record_date: { type: Date, required: true },
  initial_stock_butir: { type: Number, default: 0 },
  added_production_butir: { type: Number, default: 0 },
  sold_butir: { type: Number, default: 0 },
  damaged_butir: { type: Number, default: 0 },
  consumed_butir: { type: Number, default: 0 },
  final_stock_butir: { type: Number, default: 0 },
  notes: String,
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

// ─── Feed Item ──────────────────────────────────────────
const FeedItemSchema = new mongoose.Schema({
  _id: Number,
  name: { type: String, required: true },
  stock_kg: { type: Number, default: 0 },
  min_stock_alert_kg: { type: Number, default: 30 },
  unit_type: { type: String, default: 'karung_50kg' },
  price_per_kg: { type: Number, default: 0 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// ─── Feed Purchase ──────────────────────────────────────
const FeedPurchaseSchema = new mongoose.Schema({
  purchase_date: { type: Date, required: true },
  feed_item_id: { type: Number, ref: 'FeedItem', required: true },
  feed_name: String,
  quantity_kg: { type: Number, required: true },
  price_per_kg: { type: Number, required: true },
  total_price: { type: Number, required: true },
  payment_status: { type: String, enum: ['unpaid', 'lunas'], default: 'lunas' },
  supplier: String,
  notes: String,
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

// ─── Feed Usage ─────────────────────────────────────────
const FeedUsageSchema = new mongoose.Schema({
  usage_date: { type: Date, required: true },
  coop_id: { type: Number, default: 1 },
  feed_item_id: { type: Number, ref: 'FeedItem', required: true },
  feed_name: String,
  quantity_kg: { type: Number, required: true },
  notes: String,
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

// ─── Financial Transaction ──────────────────────────────
const FinancialTransactionSchema = new mongoose.Schema({
  transaction_date: { type: Date, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  reference_type: String,
  reference_id: String,
  description: String,
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

// ─── Settings ───────────────────────────────────────────
const SettingSchema = new mongoose.Schema({
  setting_key: { type: String, required: true, unique: true },
  setting_value: { type: String, required: true },
  description: String,
});

module.exports = {
  Coop: mongoose.model('Coop', CoopSchema),
  DuckPopulationLog: mongoose.model('DuckPopulationLog', DuckPopulationLogSchema),
  EggProduction: mongoose.model('EggProduction', EggProductionSchema),
  EggInventory: mongoose.model('EggInventory', EggInventorySchema),
  FeedItem: mongoose.model('FeedItem', FeedItemSchema),
  FeedPurchase: mongoose.model('FeedPurchase', FeedPurchaseSchema),
  FeedUsage: mongoose.model('FeedUsage', FeedUsageSchema),
  FinancialTransaction: mongoose.model('FinancialTransaction', FinancialTransactionSchema),
  Setting: mongoose.model('Setting', SettingSchema),
};
