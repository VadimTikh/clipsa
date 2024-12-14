import {AnyBulkWriteOperation} from 'mongodb'
import {getConnection} from "../../connection";
import {collections} from "../../collections";
import {DocTypeByCollectionType, ErcConnectServiceProduct} from "../../../../types";
import {log} from "../../../log";

const erc_connect_service_products = {

  getProducts: async () => {

    try {

      const client = await getConnection();

      const collection = collections.erc.connect_service(client)

      const products = await collection.find({}).toArray()

      log.dev(`erc_connect_service_products.getProducts fetched: ${products.length} products`);

      return products;

    } catch (error) {
      log.all(`Ошибка erc_connect_service_products.getProducts`)
      throw error
    }

  },

  upsertProducts: async (products: ErcConnectServiceProduct[]) => {

    try {

      const currentDate = new Date()

      const client = await getConnection();

      const collection = collections.erc.connect_service(client)

      type DocType = DocTypeByCollectionType<typeof collection>

      const bulkOps: AnyBulkWriteOperation<DocType>[] = products
        .map((product) => {

          return {
            updateOne: {
              filter: {id: product.code},
              update: {
                $set: {
                  ...product,
                  updated_at: currentDate
                },
                $setOnInsert: {
                  created_at: currentDate,
                }
              },
              upsert: true,
            }
          }
        });

      const {upsertedCount, modifiedCount} =
        await collection.bulkWrite(bulkOps);

      log.dev(`erc_connect_service_products.upsertProducts upsertedCount: ${upsertedCount}, modifiedCount:${modifiedCount}`)

    } catch (error) {
      log.all(`Ошибка erc_connect_service_products.upsertProducts`)
      throw error
    }

  }

}

export {erc_connect_service_products}
