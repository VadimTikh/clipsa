import {collections, dbNames, getConnection} from "../mongo";
import {
  StockParsedProduct,
  StockProduct,
  ParsedUnifiedProduct,
  CrmProduct
} from "../../types";
import {WithId} from "mongodb";

const products = {

  getStockParsedProducts: async (): Promise<StockParsedProduct[]> => {

    const connection = await getConnection();

    const db = connection.db(dbNames.clipsa);

    const productsStock = await db
      .collection<StockProduct>
      (
        collections.clipsaDb.products.stock
      )
      .find({})
      .toArray()

    const productsSuppliers = await db
      .collection<ParsedUnifiedProduct>
      (
        collections.clipsaDb.products.parsed_unified
      )
      .find({})
      .toArray()

    return productsStock
      .map(pStock => {

        const pStockSku = pStock.sku

        const foundSuppliersProducts = productsSuppliers
          .filter(pSupp => (
            pSupp.___connection_stock.stock_sku === pStockSku
          ))

        return {
          stock: pStock,
          parsing: foundSuppliersProducts
        }
      })
  },

  getCrmProducts: async (): Promise<WithId<CrmProduct>[]> => {

    const connection = await getConnection();

    const db = connection.db(dbNames.crm);

    const productsZeroStock = await db
      .collection<CrmProduct>
      (
        collections.crmDb.products_zero_stock
      )
      .find({})
      .toArray()

    const productsMinusStock = await db
      .collection<CrmProduct>
      (
        collections.crmDb.product_minus_stock
      )
      .find({})
      .toArray()

    const productsPlusStock = await db
      .collection<CrmProduct>
      (
        collections.crmDb.products_plus_stock
      )
      .find({})
      .toArray()

    return [
      ...productsZeroStock,
      ...productsMinusStock,
      ...productsPlusStock
    ]
  }
}

export {products}
