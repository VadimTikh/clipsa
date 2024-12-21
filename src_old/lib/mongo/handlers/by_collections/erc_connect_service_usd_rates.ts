import {getConnection} from "../../connection";
import {collections} from "../../collections";
import {ErcConnectServiceUsdRate} from "../../../../types";
import {log} from "../../../log";

const erc_connect_service_usd_rates = {

  getUsdRates: async () => {

    try {

      const client = await getConnection();

      const collection = collections.erc.rates(client)

      const rates = await collection.findOne({docName: 'main'})

      if (!rates) throw new Error('doc not found')

      log.dev(`erc_connect_service_usd_rates.getUsdRates fetched: ${JSON.stringify(rates)}`);

      return rates as ErcConnectServiceUsdRate

    } catch (error) {
      log.all(`Ошибка erc_connect_service_usd_rates.getUsdRates`)
      throw error
    }

  },

  upsertUsdRates: async (usdRates: ErcConnectServiceUsdRate) => {

    try {

      const currentDate = new Date();

      const client = await getConnection();

      const collection = collections.erc.rates(client)

      const {upsertedCount, modifiedCount} = await collection.updateOne(
        {docName: 'main'},
        {
          $set: {
            ...usdRates,
            updated_at: currentDate
          },
          $setOnInsert: {
            created_at: currentDate,
          }
        },
        {upsert: true},
      );

      log.dev(`erc_connect_service_usd_rates.upsertUsdRates upsertedCount: ${upsertedCount}, modifiedCount:${modifiedCount}`)

    } catch (error) {
      log.all(`Ошибка erc_connect_service_usd_rates.upsertUsdRates`)
      throw error
    }

  }

}

export {erc_connect_service_usd_rates}
