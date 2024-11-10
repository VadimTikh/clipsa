import cron from 'node-cron';
import {suppliers} from './handlers';
import {log} from '../lib/log';

// Every 4 hours
cron.schedule('0 */4 * * *', () => {
  void suppliers.erc.parseContentProductsToDb();
  log('Cron job parseContentProductsToDb started');
});
