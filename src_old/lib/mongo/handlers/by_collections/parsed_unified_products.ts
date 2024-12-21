import {AnyBulkWriteOperation} from 'mongodb'
import {getConnection} from "../../connection";
import {collections} from "../../collections";
import {DocTypeByCollectionType, ParsedUnifiedProduct} from "../../../../types";
import {log} from "../../../log";

const parsed_unified_products = {

  getProducts: {

    all: async () => {

      try {

        const client = await getConnection();

        const collection = collections.products.parsed_unified(client)

        const products = await collection.find({}).toArray()

        log.dev(`parsed_unified_products.getProducts.all fetched: ${products.length} products`);

        return products;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        log.all(`parsed_unified_products.getProducts.all error: ${errorMessage}`);
        throw error
      }

    },

    bySupplierName: async (
      supplier_name: ParsedUnifiedProduct['supplier_name']
    ) => {

      try {

        const client = await getConnection();

        const collection = collections.products.parsed_unified(client)

        type DocType = DocTypeByCollectionType<typeof collection>

        const query: Partial<DocType> = {
          supplier_name
        };

        const products = await collection.find(query).toArray()

        log.dev(`parsed_unified_products.getProducts.bySupplierName fetched: ${products.length} products`);

        return products;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        log.all(`parsed_unified_products.getProducts.bySupplierName error: ${errorMessage}`);
        throw error
      }

    },

    withPagination: async ({page = 1, per_page = 100}) => {

      try {
        const client = await getConnection();
        const collection = collections.products.parsed_unified(client);

        const skip = (page - 1) * per_page;

        // Count all documents for pagination
        const totalDocuments = await collection.countDocuments({});
        const page_count = Math.ceil(totalDocuments / per_page);

        // Fetch the paginated products
        const products = await collection
          .find({})
          .skip(skip)
          .limit(per_page)
          .toArray();

        return {
          data: products,
          pagination: {
            page,
            per_page,
            page_count,
          },
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        log.all(`parsed_unified_products.getProductsPagination, page: ${page}, per_page:${per_page}, error: ${errorMessage}`);
        throw error;
      }
    },

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
