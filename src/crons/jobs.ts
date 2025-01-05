import cron from 'node-cron';
import {handlers} from './handlers';
import {log} from '../lib/log';

// Каждые 4 часа
// Сохранить в БД актуальную информацию о товарах поставщиков
cron.schedule('0 */4 * * *', handlers.saveToMongoUnifiedProducts);

// Каждые 15 минут
// Обновить товары в Salesdrive
cron.schedule('0 */1 * * *', () => {
  log.all('test cron every 1 h')
})
