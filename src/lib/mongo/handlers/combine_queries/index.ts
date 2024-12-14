import {mongoHandler} from "../index";
import {log} from "../../../log";

const combine_queries = {

  getErcRawSavedData: async () => {

    try {

      const wareProductsPromise = mongoHandler
        .by_collections
        .erc_ware_products
        .getProducts()

      const connectServiceProductsPromise = mongoHandler
        .by_collections
        .erc_connect_service_products
        .getProducts()

      const connectServiceUsdRatesPromise = mongoHandler
        .by_collections
        .erc_connect_service_usd_rates
        .getUsdRates()

      const [
        wareProducts,
        connectServiceProducts,
        connectServiceUsdRates
      ] = await Promise.all([
        wareProductsPromise,
        connectServiceProductsPromise,
        connectServiceUsdRatesPromise
      ])

      return {
        wareProducts,
        connectServiceProducts,
        connectServiceUsdRates
      }

    } catch (error) {
      log.all(`combine_queries.getRawSavedData error: ${JSON.stringify(error)}`);
      throw error
    }

  },

  getCrmDividedProducts: async () => {

    try {

      const productsPlusStockPromise = mongoHandler
        .by_collections
        .crm_products_plus_stock
        .getProducts()

      const productsMinusStockPromise = mongoHandler
        .by_collections
        .crm_products_minus_stock
        .getProducts()

      const productsZeroStockPromise = mongoHandler
        .by_collections
        .crm_products_zero_stock
        .getProducts()

      const [
        productsPlusStock,
        productsMinusStock,
        productsZeroStock
      ] = await Promise.all([
        productsPlusStockPromise,
        productsMinusStockPromise,
        productsZeroStockPromise
      ])

      return [
        ...productsPlusStock,
        ...productsMinusStock,
        ...productsZeroStock
      ]

    } catch (error) {
      log.all(`combine_queries.getCrmDividedProducts error: ${JSON.stringify(error)}`);
      throw error
    }

  },

  getDataForClipsaProducts: async () => {

    try {

      const stockProducts_P = mongoHandler
        .by_collections
        .stock_products
        .getProducts()

      const crmProducts_P = mongoHandler
        .by_collections
        .crm_products
        .getProducts()

      const parsedUnifiedProducts_P = mongoHandler
        .by_collections
        .parsed_unified_products
        .getProducts()

      const connectionsProducts_P = mongoHandler
        .by_collections
        .connection_products
        .getConnections()

      const clipsaPriceRules_P = mongoHandler
        .by_collections
        .site_clipsa_price_rules
        .getRules()

      const clipsaDopNacenki_P = mongoHandler
        .by_collections
        .site_clipsa_dop_nac
        .getProducts()

      const [
        stockProducts,
        crmProducts,
        connectionsProducts,
        parsedUnifiedProducts,
        clipsaPriceRules,
        clipsaDopNacenki
      ] = await Promise.all([
        stockProducts_P,
        crmProducts_P,
        connectionsProducts_P,
        parsedUnifiedProducts_P,
        clipsaPriceRules_P,
        clipsaDopNacenki_P
      ])

      return {
        stockProducts,
        crmProducts,
        connectionsProducts,
        parsedUnifiedProducts,
        clipsaPriceRules,
        clipsaDopNacenki
      }

    } catch (error) {
      log.all(`combine_queries.getDataForClipsaProducts error: ${JSON.stringify(error)}`);
      throw error
    }
  }

}

export {combine_queries}
