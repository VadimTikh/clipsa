import {DatabaseMongo} from "../../../lib/databases";
import {getBestAvailableUnifiedProduct, createChunks} from "../../../lib/utils";
import {CrmProduct, CronHandlerParams, StockProduct, UnifiedProduct} from "../../../lib/interfaces";
import {SalesDriveApi} from "../../../lib/salesdrive/salesdrive_api";
import {Product} from "../../../lib/salesdrive/types";
import {log} from "../../../lib/log";
import {WithId} from "mongodb";

const salesDriveApi = new SalesDriveApi(process.env.SALESDRIVE_FORM_KEY)

type ProductAddToCrm = {
  stockProduct: WithId<StockProduct>;
  unifiedProduct: WithId<UnifiedProduct>;
}

type ProductUpdateCostPriceInCrm = {
  crmProduct: WithId<CrmProduct>;
  unifiedProduct: WithId<UnifiedProduct>;
}

type GetProducts = () => Promise<{
  productsAddToCrm: ProductAddToCrm[],
  productsUpdateCostPriceInCrm: ProductUpdateCostPriceInCrm[]
}>

const getProducts: GetProducts = async () => {

  try {
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
        .find(crmProduct => crmProduct.id_site === String(stockProduct._id))

      if (!!foundInCrm && foundInCrm.stock > 0) return

      const foundBestSupplier = getBestAvailableUnifiedProduct({
        stockSku,
        unifiedProducts
      })

      if (!foundBestSupplier) return

      if (!foundInCrm) {

        productsAddToCrm.push(
          {stockProduct, unifiedProduct: foundBestSupplier}
        )
        return
      }

      if (foundBestSupplier.cost_price_uah === foundInCrm.costPrice) return

      productsUpdateCostPriceInCrm.push({
        crmProduct: foundInCrm,
        unifiedProduct: foundBestSupplier
      })
    })

    return {productsAddToCrm, productsUpdateCostPriceInCrm}
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const fullError = `Не удалось сгенерировать товары для добавления и обновления в Salesdrive: ${errorMessage}`
    log.all(fullError)
    throw fullError
  }
}

const addProductsToCrm = async (products: ProductAddToCrm[]) => {

  try {
    const formatedProducts: Product[] = products.map((
      {stockProduct, unifiedProduct}
    ) => ({
      id: String(stockProduct._id),
      sku: stockProduct.sku,
      name: stockProduct.title,
      expenses: unifiedProduct.cost_price_uah,
      currencyExpenses: 'UAH',
      images: unifiedProduct.img_link ?
        [{fullsize: unifiedProduct.img_link, thumbnail: unifiedProduct.img_link}] :
        []
    }))

    const batches = createChunks<Product>(
      {array: formatedProducts, chunkSize: 100}
    )

    for (const batch of batches) {

      const response = await salesDriveApi
        .upsertProducts(
          {product: batch}
        )

      log.dev(`Added products to Salesdrive batch response: ${JSON.stringify(response.data)}`)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const fullError = `Не удалось добавить новые товары в Salesdrive: ${errorMessage}`
    log.all(fullError)
    throw fullError
  }
}

const updateCostPriceToCrm = async (products: ProductUpdateCostPriceInCrm[]) => {

  try {
    const formatedProducts: Product[] = products.map((
      {crmProduct, unifiedProduct}
    ) => ({
      id: crmProduct.id_site,
      expenses: unifiedProduct.cost_price_uah,
    }))

    const batches = createChunks<Product>(
      {array: formatedProducts, chunkSize: 100}
    )

    for (const batch of batches) {

      const response = await salesDriveApi
        .upsertProducts(
          {product: batch}
        )

      log.dev(`Updated products to Salesdrive batch response: ${JSON.stringify(response.data)}`)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const fullError = `Не удалось обновить себестоимость товарам в Salesdrive: ${errorMessage}`
    log.all(fullError)
    throw fullError
  }
}

const upsertProductsToSalesDrive = async (
  {
    onStartCallback,
    onSuccessCallback,
    onErrorCallback
  }: CronHandlerParams
) => {
  try {
    if (onStartCallback) onStartCallback()

    const {
      productsAddToCrm,
      productsUpdateCostPriceInCrm
    } = await getProducts()

    await addProductsToCrm(productsAddToCrm)

    await updateCostPriceToCrm(productsUpdateCostPriceInCrm)

    if (onSuccessCallback) onSuccessCallback()
  } catch (error) {
    if (onErrorCallback) {
      onErrorCallback(error instanceof Error ? error.message : 'Unknown error')
    }
  }
}

export default upsertProductsToSalesDrive
