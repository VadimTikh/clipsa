import {AnyBulkWriteOperation} from 'mongodb'
import {getConnection} from "../../connection";
import {collections} from "../../collections";
import {DocTypeByCollectionType, DopNacClipsa} from "../../../../types";
import {log} from "../../../log";

const site_clipsa_dop_nac = {

  getProducts: async () => {

    try {

      const client = await getConnection();

      const collection = collections.products.dop_nac_clipsa(client)

      const products = await collection.find({}).toArray()

      log.dev(`site_clipsa_dop_nac.getProducts fetched: ${products.length} products`);

      return products;

    } catch (error) {
      log.all(`Ошибка site_clipsa_dop_nac.getProducts`)
      throw error
    }

  },

  getProductBySku: async (sku: DopNacClipsa['sku']) => {

    try {

      const client = await getConnection();

      const collection = collections.products.dop_nac_clipsa(client)

      return await collection.findOne({sku});

    } catch (error) {
      log.all(`Ошибка site_clipsa_dop_nac.getProductBySku, sku: ${sku}`)
      throw error
    }

  },

  upsertProducts: async (products: DopNacClipsa[]) => {

    try {

      const currentDate = new Date()

      const client = await getConnection();

      const collection = collections.products.dop_nac_clipsa(client)

      type DocType = DocTypeByCollectionType<typeof collection>

      const bulkOps: AnyBulkWriteOperation<DocType>[] = products
        .map((product) => {

          return {
            updateOne: {
              filter: {
                sku: product.sku,
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

      log.dev(`site_clipsa_dop_nac.upsertProducts upsertedCount: ${upsertedCount}, modifiedCount:${modifiedCount}`)

    } catch (error) {
      log.all(`Ошибка site_clipsa_dop_nac.upsertProducts`)
      throw error
    }

  },

  upsertProductBySku: async (product: DopNacClipsa) => {

    try {

      const currentDate = new Date()

      const client = await getConnection();

      const collection = collections.products.dop_nac_clipsa(client)

      type DocType = DocTypeByCollectionType<typeof collection>

      const {upsertedCount, modifiedCount} = await collection.updateOne(
        {
          sku: product.sku
        },
        {
          $set: {
            value: product.value
          }
        }, {
          upsert: true
        }
      )

      log.dev(`site_clipsa_dop_nac.upsertProductBySku upsertedCount: ${upsertedCount}, modifiedCount:${modifiedCount}`)

    } catch (error) {
      log.all(`Ошибка site_clipsa_dop_nac.upsertProductBySku`)
      throw error
    }

  }

}

export {site_clipsa_dop_nac}
