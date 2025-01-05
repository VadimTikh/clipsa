import {DatabaseMongo} from "../../../lib/databases";
import {getBestAvailableUnifiedProduct} from "../../../lib/utils";
import {CrmProduct, StockProduct, UnifiedProduct} from "../../../lib/interfaces";

type ProductAddToCrm = {
  stockProduct: StockProduct;
}

type ProductUpdateCostPriceInCrm = {
  crmProduct: CrmProduct;
  unifiedProduct: UnifiedProduct;
}

type GetProducts = () => Promise<{
  productsAddToCrm: ProductAddToCrm[],
  productsUpdateCostPriceInCrm: ProductUpdateCostPriceInCrm[]
}>

type AddProductsToSalesDrive = (
  params: {
    onSuccessCallback?: (supplierName: string) => void,
    onErrorCallback?: (supplierName: string, reason: any) => void,
  }
) => void

const getProducts: GetProducts = async () => {
  const database = new DatabaseMongo()
  const crmProducts = await database.getCrmProducts()
  const stockProducts = await database.getStockProducts()
  const unifiedProducts = await database.getUnifiedProducts({
    info_status: 'linked'
  })

  const productsAddToCrm: ProductAddToCrm[] = []

  const productsUpdateCostPriceInCrm: ProductUpdateCostPriceInCrm[] = []

  stockProducts.forEach(stockProduct => {

    const stockSku = stockProduct.sku

    const foundInCrm = crmProducts
      .find(crmProduct => crmProduct.sku === stockSku)

    if (!foundInCrm) {
      productsAddToCrm.push({stockProduct})
      return
    }

    if (foundInCrm.stock > 0) return

    const foundBestSupplier = getBestAvailableUnifiedProduct({
      stockSku,
      unifiedProducts
    })

    if (!foundBestSupplier) return

    if (foundBestSupplier.cost_price_uah === foundInCrm.costPrice) return

    productsUpdateCostPriceInCrm.push({
      crmProduct: foundInCrm,
      unifiedProduct: foundBestSupplier
    })

  })

  return {productsAddToCrm, productsUpdateCostPriceInCrm}
}

const addProductsToSalesDrive: AddProductsToSalesDrive = async (
  {
    onSuccessCallback,
    onErrorCallback
  }
) => {

  const {
    productsAddToCrm,
    productsUpdateCostPriceInCrm
  } = await getProducts()

}
