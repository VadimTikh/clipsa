import {mongoHandler} from "../../mongo";
import {CrmProduct} from "../../../types";

const crm = {

  saveCrmProductsToDb: async () => {

    const oldCrmProducts = await mongoHandler.combine_queries.getCrmDividedProducts()

    const crmProductsToUpsert: CrmProduct[]  = oldCrmProducts.map(old => {

      return {
        sku: old.sku,
        stock: old.stock,
        cost_price: old.costPrice
      }
    })

    await mongoHandler.by_collections.crm_products.upsertProducts(crmProductsToUpsert)
  }

}

export {crm}
