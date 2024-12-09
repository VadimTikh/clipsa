import {WithId} from 'mongodb';
import {ErcContentApi} from '../suppliers_api';
import {getConnection, dbName, collections} from '../lib/mongo';
import {log} from '../lib/log';
import {
  ErcApiContentProduct,
  ErcApiConnectServiceProduct,
  ErcApiConnectServiceUsdRateWithDocName,
  BafCalculatedProduct,
  ContentCalculatedProduct, WithUpdatedAt, WithCreatedAt,
  SiteClipsaProduct,
  StockParsedProduct,
  ParsedUnifiedProduct, StockProduct
} from '../types';
import {ErcConnectServiceApi} from '../suppliers_api/erc';
import {erc, products as productsGetter} from '../lib/handlers'

const suppliers = {
  erc: {
    parseContentProductsToDb: async () => {

      const date = new Date()

      const ercContentApi = new ErcContentApi();

      const products = await ercContentApi.getProductsContent();

      const mongo = await getConnection();

      const collection = mongo
        .db(dbName)
        .collection<
          WithCreatedAt<WithUpdatedAt<ErcApiContentProduct>>
        >(collections.erc.content);

      const bulkOps = products.map(product => ({
        updateOne: {
          filter: {id: product.id},
          update: {
            $set: {
              ...product,
              updatedAt: date,
            },
            $setOnInsert: {
              createdAt: date,
            }
          },
          upsert: true,
        },
      }));

      const {upsertedCount, modifiedCount} =
        await collection.bulkWrite(bulkOps);

      log(
        `crons suppliers.erc.parseContentProductsToDb upsertedCount is ${upsertedCount}`,
      );

      log(
        `crons suppliers.erc.parseContentProductsToDb modifiedCount is ${modifiedCount}`,
      );
    },
    parseSpecpriceProductsToDb: async () => {
      log('crons suppliers.erc.parseSpecpriceProductsToDb started');

      const date = new Date()

      const ercContentApi = new ErcConnectServiceApi();

      const products = await ercContentApi.getProducts();

      const mongo = await getConnection();

      const collection = mongo
        .db(dbName)
        .collection<
          WithCreatedAt<WithUpdatedAt<ErcApiConnectServiceProduct>>
        >(collections.erc.specprice);

      const bulkOps = products.map(product => ({
        updateOne: {
          filter: {id: product.code},
          update: {
            $set: {
              ...product,
              updatedAt: date,
            },
            $setOnInsert: {
              createdAt: date,
            },
          },
          upsert: true,
        },
      }));

      const BATCH_SIZE = 500;

      for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
        const batch = bulkOps.slice(i, i + BATCH_SIZE);

        await collection.bulkWrite(batch);

        log(
          `crons suppliers.erc.parseSpecpriceProductsToDb proceeded: ${i + BATCH_SIZE} of ${bulkOps.length}`,
        );
      }
    },
    parseSpecpriceRateUsdToDb: async () => {
      const ercContentApi = new ErcConnectServiceApi();

      const rates = await ercContentApi.getRates();

      const mongo = await getConnection();

      const collection = mongo
        .db(dbName)
        .collection<
          WithUpdatedAt<ErcApiConnectServiceUsdRateWithDocName>
        >(collections.erc.rates);

      const {upsertedCount, modifiedCount} = await collection.updateOne(
        {docName: 'main'},
        {
          $set: {
            ...rates,
            IsError: rates?.IsError ?? false,
            ErrorCode: rates?.ErrorCode ?? 0,
            ResultMessages: rates?.ResultMessages ?? '',
            updatedAt: new Date(),
          }
        },
        {upsert: true},
      );

      log(
        `crons suppliers.erc.parseSpecpriceRateUsdToDb upsertedCount is ${upsertedCount}`,
      );

      log(
        `crons suppliers.erc.parseSpecpriceRateUsdToDb modifiedCount is ${modifiedCount}`,
      );
    }
  },
};

const products = {

  updateUnifiedProducts: async () => {

    const getErcProducts = async (): Promise<ParsedUnifiedProduct[]> => {

      const {
        unifiedProducts,
        usdRates
      } = await erc.getUnifiedProducts()

      return []
    }
  }

}

const baf = {
  calculateProductsToDb: async () => {
    log('Started products.calculateProductsToDb...');

    const mongo = await getConnection();
    const db = mongo.db(dbName);

    const getProducts = async (): Promise<BafCalculatedProduct[]> => {

      const getLowestCostSupplier = (p: StockParsedProduct) => {

        const availableSuppliers = p
          .parsing
          .filter(par => par.availability)

        if (!availableSuppliers.length) return null

        return availableSuppliers
          .reduce((lowest, supplier) => (
            supplier.cost_price_uah < lowest.cost_price_uah ? supplier : lowest
          ));
      }

      const getAvailability = (
        product: StockParsedProduct, supplier: ParsedUnifiedProduct | null
      ) => {

        return (product.stock.stock > 0 && !!supplier?.availability)
      }

      const getCostPriceByUah = (
        product: StockParsedProduct, supplier: ParsedUnifiedProduct | null
      ) => {

        let cost_price_uah = product.stock.cost_price_uah

        const isStockValid = product.stock.stock > 0

        if (!isStockValid && !!supplier && supplier.availability) {

          cost_price_uah = supplier.cost_price_uah
        }

        return Number(
          (cost_price_uah).toFixed(2)
        )
      }

      const products = await productsGetter.getStockParsedProducts()

      return products
        .map(p => {

          const supplier = getLowestCostSupplier(p)

          const supplier_name = supplier?.supplier_name ?? ''

          const id = String(p.stock._id)

          const sku = p.stock.sku

          const name = p.stock.title

          const cost_price = getCostPriceByUah(p, supplier)

          const availability = getAvailability(p, supplier)

          return {
            id,
            availability,
            cost_price,
            name,
            sku,
            supplier_name
          }
        })
    }

    const products = await getProducts();

    log(`products.calculateProductsToDb products length is ${products.length}`);

    const bulkOps = products.map(product => ({
      updateOne: {
        filter: {
          sku: product.sku,
          supplier_name: product.supplier_name,
        },
        update: {
          $set: product,
        },
        upsert: true,
      },
    }));

    const BATCH_SIZE = 500;

    for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
      const batch = bulkOps.slice(i, i + BATCH_SIZE);

      await db
        .collection<WithId<BafCalculatedProduct>>(collections.baf.products)
        .bulkWrite(batch);

      log(
        `crons suppliers.erc.parseSpecpriceProductsToDb proceeded: ${i + BATCH_SIZE} of ${bulkOps.length}`,
      );
    }
  },
};

const content = {
  calculateProductsToDb: async () => {
    log('Started products.calculateProductsToDb...');

    const mongo = await getConnection();

    const db = mongo
      .db(dbName)

    const stockCollection = db
        .collection
      < SiteClipsaProduct >
      (
        collections.products.site_clipsa
      )

    const stockProducts = await stockCollection
      .find({})
      .toArray()

    const getProducts = async (): Promise<ContentCalculatedProduct[]> => {
      return []
    }

  }
}

export {suppliers, baf};
