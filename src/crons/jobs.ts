import cron from 'node-cron';
import {handlers} from './handlers';

// Каждые 4 часа
// Сохранить в БД актуальную информацию о товарах поставщиков
cron.schedule('0 */4 * * *', () => handlers.saveToMongoUnifiedProducts());

// Каждые 4 часа
// Обновить товары в Salesdrive
cron.schedule('0 */4 * * *', () => handlers.upsertProductsToSalesDrive())
