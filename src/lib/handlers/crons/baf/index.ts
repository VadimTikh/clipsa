import {log} from "../../../log";
import {mongoHandler} from "../../../mongo";
import {BafCalculatedProduct} from "../../../../types";

const baf = {

  saveBafProductsInDb: async () => {

    try {

      const parsedUnifiedProducts = await mongoHandler
        .by_collections
        .parsed_unified_products
        .getProducts()

      const oldBafProducts = await mongoHandler
        .by_collections
        .baf_products
        .getProducts()

      const actualBafProducts: BafCalculatedProduct[] = parsedUnifiedProducts
        .map(parsedUnifiedProduct => {

          const sku = parsedUnifiedProduct.sku

          const id = String(parsedUnifiedProduct._id)

          const supplier_name = parsedUnifiedProduct.supplier_name

          const name = parsedUnifiedProduct.title

          const cost_price = parsedUnifiedProduct.cost_price_uah

          const availability = parsedUnifiedProduct.availability

          return {
            sku,
            id,
            supplier_name,
            name,
            cost_price,
            availability
          }
        })

      const missingBafProducts = oldBafProducts
        .filter(old => {

          const isExistInActualBafProducts = actualBafProducts
            .some(actual => (
              actual.sku === old.sku
            ))

          return !isExistInActualBafProducts
        })
        .map(missed => {

          return {
            ...missed,
            availability: false
          }
        })

      if (missingBafProducts.length) {

        await mongoHandler
          .by_collections
          .baf_products
          .upsertProducts(missingBafProducts)
      }

      if (actualBafProducts.length) {

        await mongoHandler
          .by_collections
          .baf_products
          .upsertProducts(actualBafProducts)
      }


    } catch (error) {
      log.all(`baf.saveBafProductsInDb error: ${JSON.stringify(error)}`);
      throw error
    }
  }
}

export {baf}
