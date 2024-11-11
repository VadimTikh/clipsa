import {WithId} from 'mongodb';
import {ErcContentApi} from '../suppliers_api';
import {getConnection, dbName, collections} from '../lib/mongo';
import {log} from '../lib/log';
import {
  ErcApiContentProduct,
  ErcApiConnectServiceProduct,
  ErcApiConnectServiceUsdRateWithDocName,
  BafCalculatedProduct,
} from '../types';
import {ErcConnectServiceApi} from '../suppliers_api/erc';

const suppliers = {
  erc: {
    parseContentProductsToDb: async () => {
      const ercContentApi = new ErcContentApi();

      const products = await ercContentApi.getProductsContent();

      const mongo = await getConnection();

      const collection = mongo
        .db(dbName)
        .collection<WithId<ErcApiContentProduct>>(collections.erc.content);

      const bulkOps = products.map(product => ({
        updateOne: {
          filter: {id: product.id},
          update: {
            $set: product,
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

      const ercContentApi = new ErcConnectServiceApi();

      const products = await ercContentApi.getProducts();

      const mongo = await getConnection();

      const collection = mongo
        .db(dbName)
        .collection<
          WithId<ErcApiConnectServiceProduct>
        >(collections.erc.specprice);

      const bulkOps = products.map(product => ({
        updateOne: {
          filter: {id: product.code},
          update: {
            $set: product,
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
          WithId<ErcApiConnectServiceUsdRateWithDocName>
        >(collections.erc.rates);

      const {upsertedCount, modifiedCount} = await collection.updateOne(
        {docName: 'main'},
        {$set: rates},
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
      const getProductsErc = async (): Promise<BafCalculatedProduct[]> => {
        const products = await db
          .collection<
            WithId<ErcApiConnectServiceProduct>
          >(collections.erc.specprice)
          .find()
          .toArray();
        const rates = await db
          .collection<
            WithId<ErcApiConnectServiceUsdRateWithDocName>
          >(collections.erc.rates)
          .findOne({docName: 'main'});

        const usdRate = rates?.paperwork;

        if (!usdRate) throw new Error('Usd rate is not provided');
        if (!products.length) throw new Error('products are not not provided');

        return products.map(p => ({
          name: p.gname,
          sku: p.code,
          supplier_name: 'ERC',
          cost_price: p.ddp === 0 ? p.sprice * usdRate : p.sprice,
          availability: p.whs.some(w => Number(w.q) > 0),
        }));
      };

      const productsErc = await getProductsErc();

      return [...productsErc];
    };

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

export {suppliers, baf};
