
import { initDB, db } from './src/db/sqlite.js';

console.log('Testing DB init...');
try {
    initDB();
    console.log('DB init success!');
    const test = db.prepare('SELECT 1').get();
    console.log('Query success:', test);
} catch (e) {
    console.error('DB init failed:', e);
}
