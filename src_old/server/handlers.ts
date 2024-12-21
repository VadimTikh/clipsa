import {NextFunction, Request, Response} from 'express';
import {mongoHandler} from '../lib/mongo';
import {handlers as libHandlers} from '../lib/handlers'
import {log} from "../lib/log";

const handlers = {
  _auth: (req: Request, res: Response, next: NextFunction) => {
    if (req?.query?.token !== process.env.TOKEN) {
      res.status(401).json({message: 'Invalid token'});
      return;
    }

    next();
  },

  web_app: {

    parsed_unified_products_without_connections: async (req: Request, res: Response) => {

      try {

        const page = Number(req.query?.page)

        const per_page = Number(req.query?.per_page)

        if (isNaN(Number(page)) || isNaN(Number(per_page))) {

          res.status(401).json({error: 'Required valid page and per_page params'});

          return
        }

        const unifiedProducts = await mongoHandler
          .by_collections
          .parsed_unified_products
          .getProducts
          .withPagination(
            {page: Number(page), per_page: Number(per_page)}
          )

        const supplierProducts = unifiedProducts.data
          .map(r => ({
            parsed_sku: r.sku,
            supplier_name: r.supplier_name
          }))

        const connections = await mongoHandler
          .by_collections
          .connection_products
          .getConnections
          .bySupplierProducts(supplierProducts)

        res.status(200).json({data});

      } catch (error) {

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        res.status(500).json({error: errorMessage});
      }
    },

    stock_products: async (req: Request, res: Response) => {

      try {

        let onlySku = false

        const only_sku = req.query?.only_sku

        if (String(only_sku) === 'true') onlySku = true

        const stockSkus = await mongoHandler
          .by_collections.stock_products.getProducts({onlySku})

        res.status(200).json({data: stockSkus});

      } catch (error) {

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        res.status(500).json({error: errorMessage});
      }
    }

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
