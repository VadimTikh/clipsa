import {AnyBulkWriteOperation} from 'mongodb'
import {getConnection} from "../../connection";
import {collections} from "../../collections";
import {DocTypeByCollectionType, ErcWareProduct} from "../../../../types";
import {log} from "../../../log";

const erc_ware_products = {

  getProducts: async () => {

    try {

      const client = await getConnection();

      const collection = collections.erc.ware(client)

      const products = await collection.find({}).toArray()

      log.dev(`erc_ware_products.getProducts fetched: ${products.length} products`);

      return products;

    } catch (error) {
      log.all(`Ошибка erc_ware_products.getProducts`)
      throw error
    }

  },

  upsertProducts: async (products: ErcWareProduct[]) => {

    try {

      const currentDate = new Date();

      const client = await getConnection();

      const collection = collections.erc.ware(client)

      type DocType = DocTypeByCollectionType<typeof collection>

      const bulkOps: AnyBulkWriteOperation<DocType>[] = products
        .map((product) => {

          return {
            updateOne: {
              filter: {id: product.id},
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

      log.dev(`erc_ware_products.upsertProducts upsertedCount: ${upsertedCount}, modifiedCount:${modifiedCount}`)

    } catch (error) {
      log.all(`Ошибка erc_ware_products.upsertProducts`)
      throw error
    }

  }

}

export {erc_ware_products}
