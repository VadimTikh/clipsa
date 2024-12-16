import {Request, Response, NextFunction} from 'express';
import {mongoHandler} from '../lib/mongo';
import {handlers as libHandlers} from '../lib/handlers'

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

      try {

        const products = await mongoHandler.by_collections.baf_products.getProducts()

        res.status(200).json({data: products});
      } catch (error) {

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        res.status(500).json({error: errorMessage});
      }
    },
  },

  content: {
    products: async (req: Request, res: Response) => {

      try {

        const products = await mongoHandler.by_collections.site_clipsa_products.getProducts()

        res.status(200).json({data: products});
      } catch (error) {

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        res.status(500).json({error: errorMessage});
      }
    },

    update_clipsa_dop_nacenka: async (req: Request, res: Response) => {

      try {

        const body = req.body;

        if (!body?.sku || isNaN(body?.dop_nac)) {
          res.status(400).json({error: 'required body type: sku: string, dop_nac: number'})
          return
        }

        const sku = String(body.sku);

        const dop_nac = Number(body.dop_nac);

        const result = await libHandlers
          .server
          .update_clipsa_dop_nacenka({sku, dop_nac})

        res.status(200).json({result});

      } catch (error) {

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        res.status(500).json({error: errorMessage});
      }
    }
  },
};

export {handlers};
