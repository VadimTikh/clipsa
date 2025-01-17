import {
  UnifiedProduct,
  SupplierApiImplementation
} from "../interfaces";
import {YugcontractApi} from './yugcontract_api'
import {PriceProduct} from './yugcontract_api/types'
import {log} from '../log'

class YugcontractApiImplementation implements SupplierApiImplementation {

  public getSupplierName(): string {
    return 'Yugcontract';
  }

  private getIsRrcRequired(priceProduct: PriceProduct) {
    if (priceProduct?.rrp_control) {
      return priceProduct.rrp_control > 0
    }
    return false
  }

  public async getUnifiedProducts(): Promise<UnifiedProduct[]> {

    try {

      // Here will be logic to fetch products from concrete (Yugcontract) supplier
      // And format the products to the unified products type

      const {
        YUGCONTRACT_API_USER_KEY,
        YUGCONTRACT_API_SECRET
      } = process.env ?? {}

      if (!YUGCONTRACT_API_USER_KEY || !YUGCONTRACT_API_SECRET) {
        throw new Error(`YUGCONTRACT_API key/secret were not found`)
      }

      const yugcontractApi = new YugcontractApi(
        YUGCONTRACT_API_USER_KEY,
        YUGCONTRACT_API_SECRET
      )

      const priceProducts = await yugcontractApi.getProductsPrice()

      if (!priceProducts.length) {
        throw new Error(`YUGCONTRACT priceProducts array is empty`)
      }

      const currentDate = new Date()

      const parsedUnifiedProducts: UnifiedProduct[] = []

      log.dev(`YugcontractApi formatting to unifiedProducts`)

      priceProducts.forEach((priceProduct) => {

        const sku = priceProduct?.artikul

        if (!sku) return

        const costPrice = priceProduct?.price

        if (!costPrice) return

        const costPriceUah = costPrice

        const isRrcRequired = this.getIsRrcRequired(priceProduct)

        const title = priceProduct?.name_ukr ?? ''

        const availability = priceProduct?.status_main === 1

        const link = priceProduct?.url || null

        const supplierName = this.getSupplierName()

        const imgLink = priceProduct?.photo || null

        const rrcValue = priceProduct?.rrp_control ?? 0

        const id = String(priceProduct.id ?? '')

        parsedUnifiedProducts.push({
          id,
          sku,
          title,
          availability,
          link,
          img_link: imgLink,
          cost_price_uah: costPriceUah,
          rrc_value: rrcValue,
          rrc_is_required: isRrcRequired,
          supplier_name: supplierName,
          updated_at: currentDate,
          created_at: currentDate,
          stock_info: {
            status: 'pending'
          }
        })
      })

      log.dev(`YugcontractApi formatted to unifiedProducts`)

      return parsedUnifiedProducts

    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.all(
        `При фетчинге имплементацией списка товаров от поставщика ${
          this?.getSupplierName() ?? ''
        }\n` +
        `возникла ошибка:\n${errorMessage}`
      )
      throw error
    }
  }
}

export {YugcontractApiImplementation}
