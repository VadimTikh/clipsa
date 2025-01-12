import {
  CrmProduct, DopNacenka, PriceRule, StockProduct, UnifiedProduct
} from "../interfaces";
import {WithId} from "mongodb";

export const getLinkedUnifiedProducts = (
  {stockSku, unifiedProducts}:
    {
      stockSku: StockProduct['sku'],
      unifiedProducts: WithId<UnifiedProduct>[]
    }
): WithId<UnifiedProduct>[] => {
  return unifiedProducts
    .filter(unifiedProduct => (
      unifiedProduct.stock_info.status === 'linked' &&
      unifiedProduct.stock_info.stock_sku === stockSku
    ))
}

export const getBestAvailableUnifiedProduct = (
  {stockSku, unifiedProducts}:
    {
      stockSku: StockProduct['sku'],
      unifiedProducts: WithId<UnifiedProduct>[]
    }
): WithId<UnifiedProduct> | null => {

  const linkedUnifiedProducts = unifiedProducts
    .filter(unifiedProduct => (
      unifiedProduct.stock_info.status === 'linked' &&
      unifiedProduct.stock_info.stock_sku === stockSku
    ))

  if (!linkedUnifiedProducts.length) return null

  const availableUnifiedProducts = linkedUnifiedProducts
    .filter(unifiedProduct => (
      unifiedProduct.availability
    ))

  if (!availableUnifiedProducts.length) return null

  // Lowest cost price unified product
  return availableUnifiedProducts
    .reduce((
      foundBestProduct,
      currentProduct
    ) => (
      currentProduct.cost_price_uah < foundBestProduct.cost_price_uah ?
        currentProduct :
        foundBestProduct
    ));

}

export const getClipsaAvailabilityAndCostPrice = (
  {stockSku, bestAvailableUnifiedProduct, crmProducts}:
    {
      stockSku: StockProduct['sku'],
      crmProducts: CrmProduct[],
      bestAvailableUnifiedProduct: UnifiedProduct | null
    }
): { availability: boolean, costPrice: number } => {

  const crmProduct = crmProducts.find(product => (
    product.sku === stockSku
  ))

  const isCrmProductAvailable =
    crmProduct &&
    crmProduct.stock > 0 &&
    crmProduct.costPrice > 0

  const isUnifiedProductAvailable =
    bestAvailableUnifiedProduct &&
    bestAvailableUnifiedProduct.availability &&
    bestAvailableUnifiedProduct.cost_price_uah > 0

  // When both are available
  if (isCrmProductAvailable && isUnifiedProductAvailable) {
    // Choose the cheapest price
    return {
      availability: true,
      costPrice: Math.min(crmProduct.costPrice, bestAvailableUnifiedProduct.cost_price_uah)
    }
  }

  // If only CRM product available
  if (isCrmProductAvailable) {
    return {
      availability: true,
      costPrice: crmProduct.costPrice
    }
  }

  // If only Unified product available
  if (isUnifiedProductAvailable) {
    return {
      availability: true,
      costPrice: bestAvailableUnifiedProduct.cost_price_uah
    }
  }

  // If neither product available, return defaults
  return {
    availability: false,
    costPrice: crmProduct?.costPrice ?? bestAvailableUnifiedProduct?.cost_price_uah ?? 0
  }
}

export const getClipsaSellPrice = (
  {stockSku, costPrice, priceRules, dopNacenki}:
    {
      stockSku: string,
      costPrice: number,
      priceRules: PriceRule[],
      dopNacenki: DopNacenka[]
    }
): number => {

  let sellPrice = 0

  if (costPrice === 0) return sellPrice;

  // Закупка БОЛЬШЕ ИЛИ РАВНО cost_price_from
  // Закупка МЕНЬШЕ cost_price_to
  const priceRule = priceRules
    .find(doc => (
      doc.site === 'Clipsa' &&
      costPrice >= doc.cost_price_from &&
      costPrice < doc.cost_price_to
    ))

  const dopNacenka = dopNacenki
    .find(doc => (
      doc.site === 'Clipsa' &&
      doc.sku === stockSku
    ))

  // Если правило не найдено
  const baseNacenkaPercent = 0.25

  sellPrice += costPrice

  sellPrice += (priceRule?.nacenka ?? (costPrice * baseNacenkaPercent))

  sellPrice += (dopNacenka?.dopNacenka ?? 0)

  return Math.ceil(sellPrice)
}

export const getClipsaOldPrice = (sellPrice: number) => {

  const discountToSellPricePercent = 0.25

  return Math.ceil(sellPrice + sellPrice * discountToSellPricePercent)
}

export const createChunks = <T>(
  {array, chunkSize}:
    {
      array: T[],
      chunkSize: number
    }
) => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}
