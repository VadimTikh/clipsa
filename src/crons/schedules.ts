import cron from 'node-cron';
import {suppliers} from './handlers';
import {log} from '../lib/log';

cron.schedule('* * * * *', () => {
  void suppliers.erc.parseContentProductsToDb();
  log('Cron job parseContentProductsToDb started');
});
