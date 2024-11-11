import cron from 'node-cron';
import {suppliers, baf} from './handlers';
import {log} from '../lib/log';

// Every 2 hours
cron.schedule('0 */2 * * *', () => {
  void suppliers.erc.parseContentProductsToDb();
  log('Cron job suppliers.erc.parseContentProductsToDb started');
});

// Every 2 hours
cron.schedule('0 */2 * * *', () => {
  void suppliers.erc.parseSpecpriceProductsToDb();
  log('Cron job suppliers.erc.parseSpecpriceProductsToDb started');
});

// Every 1 hour
cron.schedule('0 */1 * * *', () => {
  void suppliers.erc.parseSpecpriceRateUsdToDb();
  log('Cron job suppliers.erc.parseSpecpriceProductsToDb started');
});

// Every 1 hour
cron.schedule('0 */1 * * *', () => {
  void baf.calculateProductsToDb();
  log('Cron job baf.calculateProductsToDb started');
});
