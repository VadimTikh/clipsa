import {WithId} from "mongodb";

require('dotenv').config();

import {performance} from 'perf_hooks'

import {ContentProduct, CrmProduct, UnifiedProduct} from "./lib/interfaces";
import {handlers} from "./crons/cron-handlers";

import {
  getBestAvailableUnifiedProduct,
  getClipsaAvailabilityAndCostPrice, getClipsaOldPrice,
  getClipsaSellPrice,
  getLinkedUnifiedProducts
} from "./lib/utils";
import {log} from "./lib/log";
import {DatabaseMongo} from "./lib/databases";

export const getResponse = async (): Promise<void> => {
  try {
    const database = new DatabaseMongo();

    const [
      stockProducts,
      unifiedProducts,
      crmProducts,
      priceRules,
      dopNacenki
    ] = await Promise.all([
      database.getStockProducts(),
      database.getUnifiedProducts({info_status: 'linked'}),
      database.getCrmProducts(),
      database.getPriceRules({site: 'Clipsa'}),
      database.getDopNacenki()
    ])

    const linkedUnifiedProductsMap = (() => {
      const unifiedMap = new Map<string, WithId<UnifiedProduct>[]>()
      for (const u of unifiedProducts) {
        if (u.stock_info.status === 'linked') {
          const arr = unifiedMap.get(u.sku) || []
          arr.push(u)
          unifiedMap.set(u.sku, arr)
        }
      }
      return unifiedMap
    })()
    const crmProductsMap = (() => {
      const crmMap = new Map<string, WithId<CrmProduct>[]>()
      for (const c of crmProducts) {
        const arr = crmMap.get(c.sku) || []
        arr.push(c)
        crmMap.set(c.sku, arr)
      }
      return crmMap
    })()

    const products: ContentProduct[] = stockProducts
      .map(stockProduct => {

        const stockSku = stockProduct.sku
        const linkedUnifiedProducts = linkedUnifiedProductsMap?.get(stockSku) ?? []
        const bestAvailableUnifiedProduct = getBestAvailableUnifiedProduct(
          {
            stockSku,
            unifiedProducts: linkedUnifiedProducts
          }
        )
        const {availability, costPrice} = getClipsaAvailabilityAndCostPrice(
          {
            stockSku,
            bestAvailableUnifiedProduct,
            crmProducts: crmProductsMap.get(stockSku) ?? []
          }
        )
        const sellPrice = getClipsaSellPrice(
          {
            stockSku,
            costPrice,
            priceRules,
            dopNacenki
          }
        )

        const id = String(stockProduct._id)
        const sku = stockSku
        const title = stockProduct.title
        const cost_price = costPrice
        const clipsa = {
          sell_price: sellPrice,
          old_price: getClipsaOldPrice(sellPrice),
          availability: availability,
          hidden: false,
        }
        const current_suppliers = linkedUnifiedProducts
          .map(linkedUnifiedProduct => ({
            supplier_name: linkedUnifiedProduct?.supplier_name ?? '',
            supplier_sku: linkedUnifiedProduct?.sku ?? '',
            supplier_id: linkedUnifiedProduct?.id ?? ''
          }))

        return {
          id, sku, title, cost_price, clipsa, current_suppliers
        }
      })

    log.all(
      `api/content/products respond data length is ${products.length}`
    )

  } catch (error) {

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    log.all('error')
  }
}

const run = async () => {
  await getResponse()
}

run()
