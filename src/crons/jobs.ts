import cron from 'node-cron';
import {handlers} from '../lib/handlers';
import {log} from '../lib/log';

// Every 2 hours
cron.schedule('0 */2 * * *', () => {
  void handlers.crons.suppliers.erc.saveWareProductsToDb();
  log.all('Cron job suppliers.erc.saveWareProductsToDb started');
});

// Every 2 hours
cron.schedule('0 */2 * * *', () => {
  void handlers.crons.suppliers.erc.saveConnectServiceRatesUsdToDb();
  log.all('Cron jobsuppliers.erc.saveConnectServiceRatesUsdToDb() started');
});

// Every 1 hour
cron.schedule('0 */1 * * *', () => {
  void handlers.crons.suppliers.erc.saveConnectServiceRatesUsdToDb();
  log.all('Cron job suppliers.erc.saveConnectServiceRatesUsdToDb() started');
});

// Every 1 hour
cron.schedule('0 */3 * * *', () => {
  void handlers.crons.suppliers.erc.saveUnifiedProducts();
  log.all('Cron job suppliers.erc.saveUnifiedProducts started');
});

// Every 1 hour
cron.schedule('0 */1 * * *', () => {
  void handlers.crons.baf.saveBafProductsInDb();
  log.all('Cron job baf.saveBafProductsInDb started');
});

// Every 1 hour
cron.schedule('0 */1 * * *', () => {
  void handlers.crons.sites.saveClipsaProductsToDb();
  log.all('Cron job sites.saveClipsaProductsToDb started');
});

// Every 10 minutes
cron.schedule('*/10 * * * *', () => {
  void handlers.crons.crm.saveCrmProductsToDb();
  log.all('Cron job sites.saveClipsaProductsToDb started');
});
