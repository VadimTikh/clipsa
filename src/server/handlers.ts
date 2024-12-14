import {Request, Response, NextFunction} from 'express';
import {mongoHandler} from '../lib/mongo';

const handlers = {
  _auth: (req: Request, res: Response, next: NextFunction) => {
    if (req?.query?.token !== process.env.TOKEN) {
      res.status(401).json({message: 'Invalid token'});
      return;
    }

    next();
  },

  baf: {
    products: async (req: Request, res: Response) => {

      const products = await mongoHandler.by_collections.baf_products.getProducts()

      res.status(200).json({data: products});
    },
  },

  content: {
    products: async (req: Request, res: Response) => {

      const products = await mongoHandler.by_collections.site_clipsa_products.getProducts()

      res.status(200).json({data: products});
    },
  },
};

export {handlers};
