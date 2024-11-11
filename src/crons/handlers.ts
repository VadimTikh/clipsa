import {WithId} from 'mongodb';
import {ErcContentApi} from '../suppliers_api';
import {getConnection, dbName, collections} from '../lib/mongo';
import {log} from '../lib/log';
import {
  ErcApiContentProduct,
  ErcApiConnectServiceProduct,
  ErcApiConnectServiceUsdRateWithDocName,
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

export {suppliers};
