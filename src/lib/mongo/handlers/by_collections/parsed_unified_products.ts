import {AnyBulkWriteOperation} from 'mongodb'
import {getConnection} from "../../connection";
import {collections} from "../../collections";
import {DocTypeByCollectionType, ParsedUnifiedProduct} from "../../../../types";
import {log} from "../../../log";

const parsed_unified_products = {

  getProducts: async (filter?: {
    supplier_name?: ParsedUnifiedProduct['supplier_name']
  }) => {

    try {

      const client = await getConnection();

      const collection = collections.products.parsed_unified(client)

      type DocType = DocTypeByCollectionType<typeof collection>

      const query: Partial<DocType> = {};

      if (filter?.supplier_name) {
        query.supplier_name = filter.supplier_name;
      }

      const products = await collection.find(query).toArray()

      log.dev(`parsed_unified_products.getProducts fetched: ${products.length} products`);

      return products;

    } catch (error) {
      log.all(`Ошибка parsed_unified_products.getProducts`)
      throw error
    }

  },

  upsertProducts: async (products: ParsedUnifiedProduct[]) => {

    try {

      const currentDate = new Date();

      const client = await getConnection();

      const collection = collections.products.parsed_unified(client)

      type DocType = DocTypeByCollectionType<typeof collection>

      const bulkOps: AnyBulkWriteOperation<DocType>[] = products
        .map((product) => {

          return {
            updateOne: {
              filter: {
                sku: product.sku,
                supplier_name: product.supplier_name,
              },
              update: {
                $set: {
                  ...product,
                  updated_at: currentDate
                },
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

      log.dev(`parsed_unified_products.upsertProducts upsertedCount: ${upsertedCount}, modifiedCount:${modifiedCount}`)

    } catch (error) {
      log.all(`Ошибка parsed_unified_products.upsertProducts`)
      throw error
    }

  }

}

export {parsed_unified_products}
