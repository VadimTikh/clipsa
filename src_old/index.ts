require('dotenv').config();

import {startServer} from './server';
import {loadCrons} from './crons';

startServer(process.env.PORT, () => {
  console.log(`Clipsa server running on port ${process.env.PORT}`);
});

loadCrons({onlyInProduction: true}, () => {
  console.log('Cron jobs started.');
});
