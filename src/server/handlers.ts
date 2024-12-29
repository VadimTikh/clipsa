import {NextFunction, Request, Response} from 'express';
import {
  ContentProduct,
  UnifiedProduct,
  StockProduct,
  CrmProduct,
  PriceRule,
  DopNacenka,
  BafCalculatedProduct
} from '../lib/interfaces';
import {DatabaseMongo} from '../lib/databases';
import {log} from "../lib/log";

const database = new DatabaseMongo();

const getBestAvailableUnifiedProduct = (
  {stockSku, unifiedProducts}:
    {
      stockSku: StockProduct['sku'],
      unifiedProducts: UnifiedProduct[]
    }
): UnifiedProduct | null => {

  const linkedUnifiedProducts = unifiedProducts
    .filter(unifiedProduct => (
      unifiedProduct.stock_info.status === 'linked' &&
      unifiedProduct.stock_info.stock_sku === stockSku
    ))

  if (!linkedUnifiedProducts.length) return null

  const availableUnifiedProducts = linkedUnifiedProducts
    .filter(unifiedProduct => (
      unifiedProduct.availability
    ))

  if (!availableUnifiedProducts.length) return null

  // Lowest cost price unified product
  return availableUnifiedProducts
    .reduce((
      foundBestProduct,
      currentProduct
    ) => (
      currentProduct.cost_price_uah < foundBestProduct.cost_price_uah ?
        currentProduct :
        foundBestProduct
    ));

}

const getClipsaAvailabilityAndCostPrice = (
  {stockSku, bestAvailableUnifiedProduct, crmProducts}:
    {
      stockSku: StockProduct['sku'],
      crmProducts: CrmProduct[],
      bestAvailableUnifiedProduct: UnifiedProduct | null
    }
): { availability: boolean, costPrice: number } => {

  const crmProduct = crmProducts.find(product => (
    product.sku === stockSku
  ))

  const isCrmProductAvailable =
    crmProduct &&
    crmProduct.stock > 0 &&
    crmProduct.costPrice > 0

  const isUnifiedProductAvailable =
    bestAvailableUnifiedProduct &&
    bestAvailableUnifiedProduct.availability &&
    bestAvailableUnifiedProduct.cost_price_uah > 0

  // When both are available
  if (isCrmProductAvailable && isUnifiedProductAvailable) {
    // Choose the cheapest price
    return {
      availability: true,
      costPrice: Math.min(crmProduct.costPrice, bestAvailableUnifiedProduct.cost_price_uah)
    }
  }

  // If only CRM product available
  if (isCrmProductAvailable) {
    return {
      availability: true,
      costPrice: crmProduct.costPrice
    }
  }

  // If only Unified product available
  if (isUnifiedProductAvailable) {
    return {
      availability: true,
      costPrice: bestAvailableUnifiedProduct.cost_price_uah
    }
  }

  // If neither product available, return defaults
  return {
    availability: false,
    costPrice: crmProduct?.costPrice ?? bestAvailableUnifiedProduct?.cost_price_uah ?? 0
  }
}

const getClipsaSellPrice = (
  {stockSku, costPrice, priceRules, dopNacenki}:
    {
      stockSku: string,
      costPrice: number,
      priceRules: PriceRule[],
      dopNacenki: DopNacenka[]
    }
): number => {

  let sellPrice = 0

  if (costPrice === 0) return sellPrice;

  const priceRule = priceRules
    .find(doc => (
      doc.site === 'Clipsa' &&
      doc.cost_price_from <= costPrice &&
      doc.cost_price_to >= costPrice
    ))

  const dopNacenka = dopNacenki
    .find(doc => (
      doc.site === 'Clipsa' &&
      doc.sku === stockSku
    ))

  // Если правило не найдено
  const baseNacenkaPercent = 0.25

  sellPrice += (priceRule?.nacenka ?? (costPrice * baseNacenkaPercent))

  sellPrice += (dopNacenka?.dopNacenka ?? 0)

  return Math.ceil(sellPrice)
}

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
            const current_supplier = {
              supplier_name: bestAvailableUnifiedProduct?.supplier_name ?? '',
              supplier_sku: bestAvailableUnifiedProduct?.sku ?? ''
            }
            const clipsa = {
              hidden: false,
              availability: availability,
              sell_price: sellPrice
            }

            products.push(
              {id, sku, title, current_supplier, clipsa}
            )
          })

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
