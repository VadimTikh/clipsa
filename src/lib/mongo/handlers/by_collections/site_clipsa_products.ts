import {AnyBulkWriteOperation} from 'mongodb'
import {getConnection} from "../../connection";
import {collections} from "../../collections";
import {ClipsaProduct, DocTypeByCollectionType} from "../../../../types";
import {log} from "../../../log";

const site_clipsa_products = {

  getProducts: async () => {

    try {

      const client = await getConnection();

      const collection = collections.products.site_clipsa(client)

      const products = await collection.find({}).toArray()

      log.dev(`site_clipsa_products.getProducts fetched: ${products.length} rules`);

      return products;

    } catch (error) {
      log.all(`Ошибка site_clipsa_products.getProducts`)
      throw error
    }

  },

  upsertProducts: async (products: ClipsaProduct[]) => {

    try {

      const client = await getConnection();

      const collection = collections.products.site_clipsa(client)

      type DocType = DocTypeByCollectionType<typeof collection>

      const bulkOps: AnyBulkWriteOperation<DocType>[] = products
        .map((product) => {

          return {
            updateOne: {
              filter: {
                sku: product.sku,
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

      log.dev(`site_clipsa_products.upsertProducts upsertedCount: ${upsertedCount}, modifiedCount:${modifiedCount}`)

    } catch (error) {
      log.all(`Ошибка site_clipsa_products.upsertProducts`)
      throw error
    }

  }

}

export {site_clipsa_products}
