import {WithId} from 'mongodb';
import {ErcContentApi} from '../suppliers_api';
import {getConnection, dbName, collections} from '../lib/mongo';
import {log} from '../lib/log';
import {
  ErcApiContentProduct,
  ErcApiConnectServiceProduct,
  ErcApiConnectServiceUsdRateWithDocName,
  BafCalculatedProduct,
  ContentCalculatedProduct, WithUpdatedAt, WithCreatedAt
} from '../types';
import {ErcConnectServiceApi} from '../suppliers_api/erc';
import {erc} from '../lib/handlers'

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
    },
  },
};

const baf = {
  calculateProductsToDb: async () => {
    log('Started baf.calculateProductsToDb...');

    const mongo = await getConnection();
    const db = mongo.db(dbName);

    const getProducts = async (): Promise<BafCalculatedProduct[]> => {

      const getAvailability = (
        {supplier_name, sku, supplier_availability}:
          {
            supplier_name: string,
            sku: string,
            supplier_availability: boolean
          }
      ) => {

        return supplier_availability
      }

      const getCostPrice = (
        {supplier_name, sku, cost_price_usd, usd_rate}:
          {
            supplier_name: string,
            sku: string,
            cost_price_usd: number,
            usd_rate: number,
          }
      ) => {

        return Number(
          (cost_price_usd * usd_rate).toFixed(2)
        )
      }

      const getProductsErc = async (): Promise<BafCalculatedProduct[]> => {

        const supplier_name = 'ERC'

        const {
          unifiedProducts, usdRates
        } = await erc.getUnifiedProducts()

        if (!usdRates) throw new Error('ERC usdRates are null')

        return unifiedProducts.map(up => {

          const id = String(up.wareProduct.id)

          const sku = up.wareProduct.sku[0].code

          const name = up.wareProduct.title

          const supplier_availability = up.connectServiceProduct.stock

          const cost_price_usd = up.connectServiceProduct.sprice

          const usd_rate = usdRates.paperwork

          return {
            id,
            supplier_name,
            sku,
            name,
            cost_price: getCostPrice({
              supplier_name, sku, cost_price_usd, usd_rate
            }),
            availability: getAvailability({
              supplier_name, sku, supplier_availability
            })
          }
        })
      }

      const productsErc = await getProductsErc();

      return [...productsErc];
    }

    const products = await getProducts();

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
    log('Started baf.calculateProductsToDb...');

    const mongo = await getConnection();
    const db = mongo.db(dbName);

    const getProducts = async (): Promise<ContentCalculatedProduct[]> => {
      return []
    }

  }
}

export {suppliers, baf};
