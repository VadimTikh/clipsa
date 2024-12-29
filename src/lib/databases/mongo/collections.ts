import {MongoClient} from "mongodb";
import {
  UnifiedProduct, CrmProduct, StockProduct, PriceRule, DopNacenka
} from '../../interfaces'

const dbNames = {
  clipsa: 'Clipsa',
  clipsa_test: 'ClipsaTest',
  salesdrive: 'salesdrive'
}

const getCollections = (clipsaDbName: string) => ({

  products: {

    unified: (client: MongoClient) => (
      client
        .db(clipsaDbName)
        .collection<UnifiedProduct>
        ('products_unified')
    ),

    stock: (client: MongoClient) => (
      client
        .db(clipsaDbName)
        .collection<StockProduct>
        ('stock_products')
    ),

    crmMinusStock: (client: MongoClient) => (
      client
        .db(dbNames.salesdrive)
        .collection<CrmProduct>
        ('products-minus-stock')
    ),

    crmPlusStock: (client: MongoClient) => (
      client
        .db(dbNames.salesdrive)
        .collection<CrmProduct>
        ('products-plus-stock')
    ),

    crmZeroStock: (client: MongoClient) => (
      client
        .db(dbNames.salesdrive)
        .collection<CrmProduct>
        ('products-zero-stock')
    ),

    dopNacenki: (client: MongoClient) => (
      client
        .db(clipsaDbName)
        .collection<DopNacenka>
        ('dop-nacenki')
    ),
  },

  priceRules: (client: MongoClient) => (
    client
      .db(clipsaDbName)
      .collection<PriceRule>
      ('price-rules')
  ),

})

const collections = process.env.NODE_ENV === 'production' ?
  getCollections(dbNames.clipsa) :
  getCollections(dbNames.clipsa_test);

export {collections};
