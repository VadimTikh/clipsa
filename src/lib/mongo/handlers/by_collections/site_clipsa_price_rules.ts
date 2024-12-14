import {AnyBulkWriteOperation} from 'mongodb'
import {getConnection} from "../../connection";
import {collections} from "../../collections";
import {DocTypeByCollectionType, RulePriceClipsa} from "../../../../types";
import {log} from "../../../log";

const site_clipsa_price_rules = {

  getRules: async () => {

    try {

      const client = await getConnection();

      const collection = collections.products.price_rules_clipsa(client)

      const rules = await collection.find({}).toArray()

      log.dev(`site_clipsa_price_rules.getRules fetched: ${rules.length} rules`);

      return rules;

    } catch (error) {
      log.all(`Ошибка site_clipsa_price_rules.getRules`)
      throw error
    }

  },

  upsertRules: async (products: RulePriceClipsa[]) => {

    try {

      const client = await getConnection();

      const collection = collections.products.price_rules_clipsa(client)

      type DocType = DocTypeByCollectionType<typeof collection>

      const bulkOps: AnyBulkWriteOperation<DocType>[] = products
        .map((rule) => {

          return {
            updateOne: {
              filter: {
                cost_price_from: rule.cost_price_from,
                cost_price_to: rule.cost_price_to,
                value: rule.value
              },
              update: {
                $set: rule
              },
              upsert: true,
            }
          }
        });

      const {upsertedCount, modifiedCount} =
        await collection.bulkWrite(bulkOps);

      log.dev(`site_clipsa_price_rules.upsertRules upsertedCount: ${upsertedCount}, modifiedCount:${modifiedCount}`)

    } catch (error) {
      log.all(`Ошибка site_clipsa_price_rules.upsertRules`)
      throw error
    }

  }

}

export {site_clipsa_price_rules}
