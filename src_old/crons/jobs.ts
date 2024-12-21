import cron from 'node-cron';
import {handlers} from '../lib/handlers';
import {log} from '../lib/log';

// Every 3 hours
// Сохранить в БД всю информацию по поставщику ERC
cron.schedule('0 */3 * * *', () => {

  handlers.crons.unified.saveErcRawSuppliersDataThenSaveUnifiedProducts()
    .then(() => {
      log.all(`unified.saveErcRawSuppliersDataThenSaveUnifiedProducts finished!`)
    })

  log.all('Cron job unified.saveErcRawSuppliersDataThenSaveUnifiedProducts started');
});

// Every 1 hour
// Сохранить в БД информацию со списком товаров от поставщиков
// Для 1C (Ивану)
cron.schedule('0 */1 * * *', () => {

  handlers.crons.baf.saveBafProductsInDb()
    .then(() => {
      log.all(`job baf.saveBafProductsInDb finished!`)
    })

  log.all('Cron job baf.saveBafProductsInDb started');
});

// Every 1 hour
// Сохранить в БД информацию со списком товаров с ценами и наличием
// для Клипсы (Игорю)
cron.schedule('0 */1 * * *', () => {

  handlers.crons.sites.saveClipsaProductsToDb()
    .then(() => {
      log.all(`job sites.saveClipsaProductsToDb finished!`)
    })

  log.all('Cron job sites.saveClipsaProductsToDb started');
});

// Every 10 minutes
// Сохранить в БД информацию со списком товаров с СРМ с остатками и себестоимостями
// Из старых коллекций (по остаткам)
cron.schedule('*/10 * * * *', () => {

  handlers.crons.crm.saveCrmProductsToDb()
    .then(() => {
      log.all(`job crm.saveCrmProductsToDb finished!`)
    })

  log.all('Cron job crm.saveCrmProductsToDb started');
});
