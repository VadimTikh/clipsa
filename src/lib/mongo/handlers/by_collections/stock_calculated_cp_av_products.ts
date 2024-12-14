import {AnyBulkWriteOperation} from 'mongodb'
import {getConnection} from "../../connection";
import {collections} from "../../collections";
import {CostAndAvailabilityStockProduct, DocTypeByCollectionType} from "../../../../types";
import {log} from "../../../log";

const stock_calculated_cp_av_products = {

  getProducts: async () => {

    try {

      const client = await getConnection();

      const collection = collections.products.stock_calculated_cp_av(client)

      const products = await collection.find({}).toArray()

      log.dev(`stock_calculated_cp_av_products.getProducts fetched: ${products.length} rules`);

      return products;

    } catch (error) {
      log.all(`Ошибка stock_calculated_cp_av_products.getProducts`)
      throw error
    }

  },

  upsertProducts: async (products: CostAndAvailabilityStockProduct[]) => {

    try {

      const currentDate = new Date();

      const client = await getConnection();

      const collection = collections.products.stock_calculated_cp_av(client)

      type DocType = DocTypeByCollectionType<typeof collection>

      const bulkOps: AnyBulkWriteOperation<DocType>[] = products
        .map((product) => {

          return {
            updateOne: {
              filter: {
                sku: product.sku
              },
              update: {
                $set: {
                  ...product,
                  updated_at: currentDate
                }
              },
              upsert: true,
            }
          }
        });

      const {upsertedCount, modifiedCount} =
        await collection.bulkWrite(bulkOps);

      log.dev(`stock_calculated_cp_av_products.upsertProducts upsertedCount: ${upsertedCount}, modifiedCount:${modifiedCount}`)

    } catch (error) {
      log.all(`Ошибка stock_calculated_cp_av_products.upsertProducts`)
      throw error
    }

  }

}

export {stock_calculated_cp_av_products}
