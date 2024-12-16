import {AnyBulkWriteOperation} from 'mongodb'
import {getConnection} from "../../connection";
import {collections} from "../../collections";
import {ClipsaProduct, DocTypeByCollectionType} from "../../../../types";
import {log} from "../../../log";

const site_clipsa_products = {

  getProductBySku: async (sku: ClipsaProduct['sku']) => {

    try {

      const client = await getConnection();

      const collection = collections.products.site_clipsa(client)

      return await collection.findOne({sku});

    } catch (error) {
      log.all(`Ошибка site_clipsa_products.getProductBySku, sku is ${sku}`)
      throw error
    }

  },

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

  updateProductDopNacBySku: async (
    sku: ClipsaProduct['sku'],
    dopNac: ClipsaProduct['sell_price_components']['nacenka_dop']
  ) => {

    try {

      const client = await getConnection();

      const collection = collections.products.site_clipsa(client)

      await collection.updateOne(
        {
          sku
        },
        {
          $set: {
            "sell_price_components.nacenka_dop": dopNac
          }
        },
        {
          upsert: false
        }
      )

    } catch (error) {
      log.all(`Ошибка site_clipsa_products.updateProductDopNacBySku for sku: ${sku}, dopNac: ${dopNac}`)
      throw error
    }
  },

  updateProductSellPriceBySku: async (
    sku: ClipsaProduct['sku'],
    sellPrice: ClipsaProduct['sell_price']
  ) => {

    try {

      const client = await getConnection();

      const collection = collections.products.site_clipsa(client)

      await collection.updateOne(
        {
          sku
        },
        {
          $set: {
            sell_price: sellPrice
          }
        },
        {
          upsert: false
        }
      )

    } catch (error) {
      log.all(`Ошибка site_clipsa_products.updateProductSellPriceBySku for sku: ${sku}, sellPrice: ${sellPrice}`)
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
