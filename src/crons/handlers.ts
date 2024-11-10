import {WithId} from 'mongodb';
import {ErcContentApi} from '../suppliers_api';
import {getConnection, dbName, collections} from '../lib/mongo';
import {log} from '../lib/log';
import {ErcApiContentProduct} from '../types';

const suppliers = {
  erc: {
    parseContentProductsToDb: async () => {
      const ercContentApi = new ErcContentApi();

      const products = await ercContentApi.getProducts();

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
  },
};

export {suppliers};
