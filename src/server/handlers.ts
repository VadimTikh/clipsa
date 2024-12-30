import {NextFunction, Request, Response} from 'express';
import {
  ContentProduct,
  BafCalculatedProduct
} from '../lib/interfaces';
import {DatabaseMongo} from '../lib/databases';
import {
  getClipsaSellPrice,
  getClipsaAvailabilityAndCostPrice,
  getBestAvailableUnifiedProduct,
  getClipsaOldPrice
} from '../lib/utils'
import {log} from "../lib/log";

const database = new DatabaseMongo();

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

        const products: BafCalculatedProduct[] = []

        const unifiedProducts = await database.getUnifiedProducts()

        unifiedProducts
          .forEach(unifiedProduct => {

            const sku = unifiedProduct.sku
            const supplier_name = unifiedProduct.supplier_name
            const name = unifiedProduct.title
            const id = String(unifiedProduct._id)
            const cost_price = unifiedProduct.cost_price_uah
            const availability = unifiedProduct.availability

            products.push(
              {sku, supplier_name, name, id, cost_price, availability}
            )
          })

        res.status(200).json({data: products});
      } catch (error) {

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        res.status(500).json({error: errorMessage});
      }
    },
  },

  content: {
    /*
      1. Себестоимость может быть 0, если товар не найден ни  у поставщика ни в СРМ.
      2. Цена продажи может быть 0, если нет себестоимости
      3. Наличие false, если нет себестоимости
      4. Правила наценки используются с техномикса (пока что хард-кодены в бд). Если вдруг не найдено правило наценки, будем использоваться дефолтная: 25%
     */
    products: async (req: Request, res: Response) => {

      try {

        const products: ContentProduct[] = []

        const [
          stockProducts,
          unifiedProducts,
          crmProducts,
          priceRules,
          dopNacenki
        ] = await Promise.all([
          database.getStockProducts(),
          database.getUnifiedProducts({info_status: 'linked'}),
          database.getCrmProducts(),
          database.getPriceRules({site: 'Clipsa'}),
          database.getDopNacenki()
        ])

        stockProducts
          .forEach(stockProduct => {

            const stockSku = stockProduct.sku
            const bestAvailableUnifiedProduct = getBestAvailableUnifiedProduct(
              {
                stockSku,
                unifiedProducts
              }
            )
            const {availability, costPrice} = getClipsaAvailabilityAndCostPrice(
              {
                stockSku,
                bestAvailableUnifiedProduct,
                crmProducts
              }
            )
            const sellPrice = getClipsaSellPrice(
              {
                stockSku,
                costPrice,
                priceRules,
                dopNacenki
              }
            )

            const id = String(stockProduct._id)
            const sku = stockSku
            const title = stockProduct.title
            const cost_price = costPrice
            const clipsa = {
              sell_price: sellPrice,
              old_price: getClipsaOldPrice(sellPrice),
              availability: availability,
              hidden: false,
            }
            const current_supplier = {
              supplier_name: bestAvailableUnifiedProduct?.supplier_name ?? '',
              supplier_sku: bestAvailableUnifiedProduct?.sku ?? ''
            }

            products.push(
              {id, sku, title, cost_price, clipsa, current_supplier}
            )
          })

        log.dev(
          `api/content/products respond data length is ${products.length}`
        )
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

        await database.upsertClipsaDopNacenka(
          {
            site: 'Clipsa',
            sku,
            dopNacenka: dop_nac
          }
        )

        const [
          unifiedProducts,
          crmProducts,
          priceRules,
          dopNacenki
        ] = await Promise.all([
          database.getUnifiedProducts({info_status: 'linked'}),
          database.getCrmProducts(),
          database.getPriceRules({site: 'Clipsa'}),
          database.getDopNacenki()
        ])

        const bestAvailableUnifiedProduct = getBestAvailableUnifiedProduct(
          {
            stockSku: sku,
            unifiedProducts
          }
        )

        const {costPrice} = getClipsaAvailabilityAndCostPrice(
          {
            stockSku: sku,
            crmProducts,
            bestAvailableUnifiedProduct
          }
        )

        const sellPrice = getClipsaSellPrice(
          {
            stockSku: sku,
            dopNacenki,
            priceRules,
            costPrice
          }
        )

        const result = {
          sku, price: sellPrice
        }

        res.status(200).json({result});

      } catch (error) {

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        res.status(500).json({error: errorMessage});
      }
    }
  },
};

export {handlers};
