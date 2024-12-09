import {collections, dbName, getConnection} from "../mongo";
import {
  StockParsedProduct,
  StockProduct,
  ParsedUnifiedProduct
} from "../../types";

const products = {

  getStockParsedProducts: async (): Promise<StockParsedProduct[]> => {

    const connection = await getConnection();

    const db = connection.db(dbName);

    const productsStock = await db
      .collection<StockProduct>
      (
        collections.products.stock
      )
      .find({})
      .toArray()

    const productsSuppliers = await db
      .collection<ParsedUnifiedProduct>
      (
        collections.products.parsed_unified
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
  }

}

export {products}
