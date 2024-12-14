import {MongoClient} from "mongodb";
import {
  WithCreatedAt,
  WithUpdatedAt,
  ErcWareProduct,
  ConnectionProduct,
  RulePriceClipsa,
  StockProduct,
  CostAndAvailabilityStockProduct,
  CrmProduct,
  ClipsaProduct,
  ParsedUnifiedProduct,
  ErcConnectServiceProduct,
  ErcConnectServiceUsdRate,
  BafCalculatedProduct,
  CrmProductOld
} from "../../types";

const dbNames = {
  clipsa: 'Clipsa',
  clipsa_test: 'ClipsaTest',
  salesdrive: 'salesdrive'
}

const getCollections = (dbName: string) => ({

  products: {

    parsed_unified: (client: MongoClient) => (
      client
        .db(dbName)
        .collection<WithCreatedAt<WithUpdatedAt<ParsedUnifiedProduct>>>
        ('parsed_unified_products')
    ),

    stock: (client: MongoClient) => (
      client
        .db(dbName)
        .collection<WithCreatedAt<StockProduct>>
        ('stock_products')
    ),

    stock_calculated_cp_av: (client: MongoClient) => (
      client
        .db(dbName)
        .collection<WithUpdatedAt<CostAndAvailabilityStockProduct>>
        ('stock_calculated_cp_av_products')
    ),

    site_clipsa: (client: MongoClient) => (
      client
        .db(dbName)
        .collection<ClipsaProduct>
        ('site_clipsa_products')
    ),

    crm: (client: MongoClient) => (
      client
        .db(dbName)
        .collection<CrmProduct>
        ('crm_products')
    ),

    connections: (client: MongoClient) => (
      client
        .db(dbName)
        .collection<WithCreatedAt<ConnectionProduct>>
        ('connection_products')
    ),

    price_rules_clipsa: (client: MongoClient) => (
      client
        .db(dbName)
        .collection<RulePriceClipsa>
        ('site_clipsa_price_rules')
    ),

  },

  erc: {

    ware: (client: MongoClient) => (
      client
        .db(dbName)
        .collection<WithCreatedAt<WithUpdatedAt<ErcWareProduct>>>
        ('erc_ware_products')
    ),

    connect_service: (client: MongoClient) => (
      client
        .db(dbName)
        .collection<WithCreatedAt<WithUpdatedAt<ErcConnectServiceProduct>>>
        ('erc_connect_service_products')
    ),

    rates: (client: MongoClient) => (
      client
        .db(dbName)
        .collection<
          WithCreatedAt<WithUpdatedAt<ErcConnectServiceUsdRate>> |
          Record<string, any>
        >
        ('erc_connect_service_usd_rates')
    ),

  },
  baf: {

    products: (client: MongoClient) => (
      client
        .db(dbName)
        .collection<BafCalculatedProduct>
        ('baf_products')
    ),
  },

  crm: {

    products_minus_stock: (client: MongoClient) => (
      client
        .db(dbNames.salesdrive)
        .collection<CrmProductOld>
        ('products-minus-stock')
    ),

    products_plus_stock: (client: MongoClient) => (
      client
        .db(dbNames.salesdrive)
        .collection<CrmProductOld>
        ('products-plus-stock')
    ),

    products_zero_stock: (client: MongoClient) => (
      client
        .db(dbNames.salesdrive)
        .collection<CrmProductOld>
        ('products-zero-stock')
    ),

  }

})

const collections = process.env.NODE_ENV === 'production' ?
  getCollections(dbNames.clipsa) :
  getCollections(dbNames.clipsa_test);

export {collections};
