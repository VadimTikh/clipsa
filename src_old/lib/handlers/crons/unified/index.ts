import {handlers} from "../../index";
import {log} from "../../../log";

const unified = {

  saveErcRawSuppliersData: async () => {

    try {

      return await Promise.all([
        handlers.crons.suppliers.erc.saveConnectServiceRatesUsdToDb(),
        handlers.crons.suppliers.erc.saveWareProductsToDb(),
        handlers.crons.suppliers.erc.saveConnectServiceProductsToDb()
      ])
    } catch (error) {
      log.all(`unified.saveErcRawSuppliersData error: ${JSON.stringify(error)}`);
      throw error
    }
  },

  saveErcRawSuppliersDataThenSaveUnifiedProducts: async () => {

    try {

      await handlers.crons.unified.saveErcRawSuppliersData()

      await handlers.crons.suppliers.erc.saveUnifiedProducts()

    } catch (error) {
      log.all(`unified.saveErcRawSuppliersDataThenSaveUnifiedProducts error: ${JSON.stringify(error)}`);
      throw error
    }

  }

}

export {unified}
