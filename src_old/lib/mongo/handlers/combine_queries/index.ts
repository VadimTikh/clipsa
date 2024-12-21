import {mongoHandler} from "../index";
import {log} from "../../../log";
import {getConnection} from "../../connection";
import {collections} from "../../collections";

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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.all(`combine_queries.getRawSavedData error: ${errorMessage}`);
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.all(`combine_queries.getCrmDividedProducts error: ${errorMessage}`);
      throw error
    }

  },

  getDataForClipsaProducts: async () => {

    try {

      const stockProducts_P = mongoHandler
        .by_collections
        .stock_products
        .getProducts({})

      const crmProducts_P = mongoHandler
        .by_collections
        .crm_products
        .getProducts()

      const parsedUnifiedProducts_P = mongoHandler
        .by_collections
        .parsed_unified_products
        .getProducts
        .all()

      const connectionsProducts_P = mongoHandler
        .by_collections
        .connection_products
        .getConnections
        .all()

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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.all(`combine_queries.getDataForClipsaProducts error: ${errorMessage}`);
      throw error
    }
  },

  getParsedUnifiedProductsNotConnected: async (
    {page, page_size}: { page: number, page_size: number }
  ) => {

    try {

      const client = await getConnection();

      const collectionUnifiedProducts = collections
        .products
        .parsed_unified(client)

      const collectionConnections = collections
        .products
        .connections(client)

      const result = await collectionUnifiedProducts.aggregate([
        {
          $lookup: {
            from: `${collectionConnections.collectionName}`, // The second collection
            let: { supplier_name: "$supplier_name", sku: "$sku" }, // Fields from Collection1 to compare
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$sup_name", "$$supplier_name"] }, // Match supname with sup_name
                      { $eq: ["$tov_sku", "$$sku"] } // Match sku with tov_sku
                    ]
                  }
                }
              }
            ],
            as: 'matchedDocs' // Name of the resulting array
          }
        },
        {
          $match: {
            matchedDocs: { $eq: [] } // Keep only documents with no matches
          }
        },
        {
          $skip: skip // Skip documents for pagination
        },
        {
          $limit: limit // Limit the number of documents returned
        },
        {
          $project: {
            matchedDocs: 0 // Optionally exclude matchedDocs from the output
          }
        }
      ]).toArray();

      console.log(result);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.all(`combine_queries.getParsedUnifiedProductsNotConnected: ${errorMessage}`);
      throw error
    }
  }
}

export {combine_queries}
