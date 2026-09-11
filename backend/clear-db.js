/**
 * clear-db.js — Script untuk menghapus semua data di MongoDB
 * Jalankan dengan: node clear-db.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/duck_farm_db';

async function clearAll() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected:', mongoose.connection.host);

    const collections = await mongoose.connection.db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('ℹ️  Database sudah kosong, tidak ada koleksi yang perlu dihapus.');
    } else {
      console.log(`🗑️  Menghapus ${collections.length} koleksi...`);
      for (const col of collections) {
        await mongoose.connection.db.dropCollection(col.name);
        console.log(`   ✓ Koleksi "${col.name}" dihapus.`);
      }
      console.log('\n✅ Semua data berhasil dihapus! Database sekarang kosong.');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
}

clearAll();
