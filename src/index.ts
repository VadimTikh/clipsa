require('dotenv').config();

import {startServer} from './server';
import {loadCrons} from './crons';

startServer(process.env.PORT, () => {
  console.log(`Clipsa server running on port ${process.env.PORT}`);
});

loadCrons({onlyInProduction: false}, () => {
  console.log('Cron jobs started.');
});
