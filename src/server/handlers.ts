import {NextFunction, Request, Response} from 'express';
import {
  ContentProduct,
  BafCalculatedProduct, UnifiedProduct, CrmProduct
} from '../lib/interfaces';
import {DatabaseMongo} from '../lib/databases';
import {
  getClipsaSellPrice,
  getClipsaAvailabilityAndCostPrice,
  getBestAvailableUnifiedProduct,
  getClipsaOldPrice,
  getLinkedUnifiedProducts
} from '../lib/utils'
import {log} from "../lib/log";
import {WithId} from "mongodb";

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

        const linkedUnifiedProductsMap = (() => {
          const unifiedMap = new Map<string, WithId<UnifiedProduct>[]>()
          for (const u of unifiedProducts) {
            if (u.stock_info.status === 'linked') {
              const arr = unifiedMap.get(u.stock_info.stock_sku) || []
              arr.push(u)
              unifiedMap.set(u.stock_info.stock_sku, arr)
            }
          }
          return unifiedMap
        })()
        const crmProductsMap = (() => {
          const crmMap = new Map<string, WithId<CrmProduct>[]>()
          for (const c of crmProducts) {
            const arr = crmMap.get(c.sku) || []
            arr.push(c)
            crmMap.set(c.sku, arr)
          }
          return crmMap
        })()

        const products: ContentProduct[] = stockProducts
          .map(stockProduct => {

            const stockSku = stockProduct.sku
            const linkedUnifiedProducts = linkedUnifiedProductsMap?.get(stockSku) ?? []
            const bestAvailableUnifiedProduct = getBestAvailableUnifiedProduct(
              {
                stockSku,
                unifiedProducts: linkedUnifiedProducts
              }
            )
            const {availability, costPrice} = getClipsaAvailabilityAndCostPrice(
              {
                stockSku,
                bestAvailableUnifiedProduct,
                crmProducts: crmProductsMap.get(stockSku) ?? []
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
            const current_suppliers = linkedUnifiedProducts
              .map(linkedUnifiedProduct => ({
                supplier_name: linkedUnifiedProduct?.supplier_name ?? '',
                supplier_sku: linkedUnifiedProduct?.sku ?? '',
                supplier_id: linkedUnifiedProduct?.id ?? ''
              }))

            return {
              id, sku, title, cost_price, clipsa, current_suppliers
            }
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
