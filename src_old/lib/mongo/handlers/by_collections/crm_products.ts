import {AnyBulkWriteOperation} from 'mongodb'
import {getConnection} from "../../connection";
import {collections} from "../../collections";
import {CrmProduct} from "../../../../types";
import {log} from "../../../log";

const crm_products = {

  getProducts: async () => {

    try {

      const client = await getConnection();

      const collection = collections.products.crm(client)

      const products = await collection.find({}).toArray()

      log.dev(`crm_products.getProducts fetched: ${products.length} products`);

      return products;

    } catch (error) {
      log.all(`Ошибка crm_products.getProducts`)
      throw error
    }

  },

  upsertProducts: async (products: CrmProduct[]) => {

    try {

      const client = await getConnection();

      const collection = collections.products.crm(client)

      const bulkOps: AnyBulkWriteOperation<CrmProduct>[] = products
        .map((product) => {

          return {
            updateOne: {
              filter: {
                sku: product.sku
              },
              update: {
                $set: product
              },
              upsert: true,
            }
          }
        });

      const {upsertedCount, modifiedCount} =
        await collection.bulkWrite(bulkOps);

      log.dev(`crm_products.upsertProducts upsertedCount: ${upsertedCount}, modifiedCount:${modifiedCount}`)

    } catch (error) {
      log.all(`Ошибка crm_products.upsertProducts`)
      throw error
    }

  }

}

export {crm_products}
