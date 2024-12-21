import {AnyBulkWriteOperation} from 'mongodb'
import {getConnection} from "../../connection";
import {collections} from "../../collections";
import {BafCalculatedProduct} from "../../../../types";
import {log} from "../../../log";

const baf_products = {

  getProducts: async () => {

    try {

      const client = await getConnection();

      const collection = collections.baf.products(client)

      const products = await collection.find({}).toArray()

      log.dev(`baf_products.getProducts fetched: ${products.length} products`);

      return products;

    } catch (error) {
      log.all(`Ошибка baf_products.getProducts`);
      throw error;
    }
  },

  upsertProducts: async (products: BafCalculatedProduct[]) => {

    try {

      const client = await getConnection();

      const collection = collections.baf.products(client)

      const bulkOps: AnyBulkWriteOperation<BafCalculatedProduct>[] = products
        .map((product) => {

          return {
            updateOne: {
              filter: {
                sku: product.sku
              },
              update: {
                $set: product,
              },
              upsert: true,
            }
          }
        });

      const {upsertedCount, modifiedCount} =
        await collection.bulkWrite(bulkOps);

      log.dev(`baf_products.upsertProducts upsertedCount: ${upsertedCount}, modifiedCount:${modifiedCount}`)

    } catch (error) {
      log.all(`Ошибка baf_products.upsertProducts`)
      throw error
    }

  }

}

export {baf_products}
