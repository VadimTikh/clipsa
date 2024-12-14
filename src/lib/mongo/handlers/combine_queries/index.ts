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
      log.all(`queries.erc.getRawSavedData error: ${JSON.stringify(error)}`);
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
      log.all(`queries.erc.getCrmDividedProducts error: ${JSON.stringify(error)}`);
      throw error
    }

  }

}

export {combine_queries}
