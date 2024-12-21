import {AnyBulkWriteOperation, FindOptions} from 'mongodb'
import {getConnection} from "../../connection";
import {collections} from "../../collections";
import {DocTypeByCollectionType, StockProduct} from "../../../../types";
import {log} from "../../../log";

const stock_products = {

  getProducts: async (
    {
      onlySku = false
    }: {
      onlySku?: boolean
    }
  ) => {

    try {

      const client = await getConnection();

      const collection = collections.products.stock(client)

      type DocType = DocTypeByCollectionType<typeof collection>

      const options: FindOptions<DocType> = {}

      if (onlySku) {
        options.projection = {
          _id: 1,
          sku: 1
        }
      }

      const products = await collection.find({}, options).toArray()

      log.dev(`stock_products.getProducts fetched ${products.length} products. onlySku: ${onlySku}`);

      return products;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.all(`Ошибка stock_products.getProducts, ${errorMessage}. onlySku: ${onlySku}`);
      throw error
    }

  },

  upsertProducts: async (products: StockProduct[]) => {

    try {

      const currentDate = new Date()

      const client = await getConnection();

      const collection = collections.products.stock(client)

      type DocType = DocTypeByCollectionType<typeof collection>

      const bulkOps: AnyBulkWriteOperation<DocType>[] = products
        .map((product) => {

          return {
            updateOne: {
              filter: {
                sku: product.sku
              },
              update: {
                $set: product,
                $setOnInsert: {
                  created_at: currentDate
                }
              },
              upsert: true,
            }
          }
        });

      const {upsertedCount, modifiedCount} =
        await collection.bulkWrite(bulkOps);

      log.dev(`stock_products.upsertProducts upsertedCount: ${upsertedCount}, modifiedCount:${modifiedCount}`)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.all(`Ошибка stock_products.upsertProducts, ${errorMessage}`)
      throw error
    }

  }

}

export {stock_products}
