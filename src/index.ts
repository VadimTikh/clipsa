require('dotenv').config();

import {loadCrons} from './crons';

loadCrons({onlyInProduction: false}, () => {
  console.log('Cron jobs started.');
});
