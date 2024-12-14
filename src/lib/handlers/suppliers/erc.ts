import {ercApiHandler} from "../../suppliers_api";
import {mongoHandler} from "../../mongo";
import {log} from "../../log";

const erc = {

  saveWareProductsToDb: async () => {

    try {

      const ercContentApi = new ercApiHandler.ErcContentApi();

      const products = await ercContentApi.getProducts();

      await mongoHandler
        .by_collections
        .erc_ware_products
        .upsertProducts(products)

    } catch (error) {
      log.all(`erc.saveWareProductsToDb error: ${JSON.stringify(error)}`);
      throw error;
    }
  },

  saveConnectServiceProductsToDb: async () => {

    try {

      const ercConnectServiceApi = new ercApiHandler.ErcConnectServiceApi();

      const products = await ercConnectServiceApi.getProducts();

      await mongoHandler
        .by_collections
        .erc_connect_service_products
        .upsertProducts(products)

    } catch (error) {
      log.all(`erc.saveConnectServiceProductsToDb error: ${JSON.stringify(error)}`);
      throw error;
    }
  },

  saveConnectServiceRatesUsdToDb: async () => {

    try {

      const ercConnectServiceApi = new ercApiHandler.ErcConnectServiceApi();

      const rates = await ercConnectServiceApi.getRates();

      await mongoHandler
        .by_collections
        .erc_connect_service_usd_rates
        .upsertUsdRates(rates)

    } catch (error) {
      log.all(`erc.saveConnectServiceRatesUsdToDb error: ${JSON.stringify(error)}`);
      throw error;
    }
  },

  saveUnifiedProducts: async () => {

    try {

      const {
        wareProducts,
        connectServiceProducts,
        connectServiceUsdRates
      } = await mongoHandler.combine_queries.getErcRawSavedData()

      const oldUnifiedProducts = await mongoHandler
        .by_collections
        .parsed_unified_products
        .getProducts({supplier_name: ercApiHandler.ErcUnifiedProductCreator.SUPPLIER_NAME})

      const actualUnifiedProduct = new ercApiHandler
        .ErcUnifiedProductCreator(wareProducts, connectServiceProducts, connectServiceUsdRates)
        .getUnifiedProducts()

      const missingUnifiedProducts = oldUnifiedProducts
        .filter(old => {

          const isExistInActualUnifiedProducts = actualUnifiedProduct
            .some(actual => (
              actual.sku === old.sku
            ))

          return !isExistInActualUnifiedProducts
        })
        .map(missed => {

          return {
            ...missed,
            availability: false
          }
        })

      if (missingUnifiedProducts.length) {
        await mongoHandler
          .by_collections
          .parsed_unified_products
          .upsertProducts(missingUnifiedProducts)
      }

      await mongoHandler
        .by_collections
        .parsed_unified_products
        .upsertProducts(actualUnifiedProduct)

    } catch (error) {
      log.all(`erc.saveUnifiedProducts error: ${JSON.stringify(error)}`);
      throw error
    }
  }
}

export {erc}
