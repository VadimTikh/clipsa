import express from 'express';
import {handlers} from './handlers';

const app = express();

app.use(express.json());

app.get('/api/baf/products', handlers._auth, handlers.baf.products);

app.get('/api/content/products', handlers._auth, handlers.content.products);

const startServer = (port: string | undefined, callback: () => void) => {
  if (!port) throw new Error('Clipsa server port is not defined');
  app.listen(port, callback);
};

export {startServer};
