import cron from 'node-cron';
import {handlers} from "./cron-handlers";

console.log(handlers)

// Каждые 4 часа
// Сохранить в БД актуальную информацию о товарах поставщиков
cron.schedule('0 */4 * * *', () => handlers.saveToMongoUnifiedProducts());

// Каждые 3 часа, но с задержкой 30 минут
// Обновить товары в Salesdrive
cron.schedule('30 */3 * * *', () => handlers.upsertProductsToSalesDrive())
