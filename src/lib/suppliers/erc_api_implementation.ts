import {
  UnifiedProduct,
  SupplierApiImplementation
} from "../interfaces";
import {ErcContentApi, ErcConnectServiceApi} from './erc_api'
import {log} from '../log'

class ErcApiImplementation implements SupplierApiImplementation {

  public getSupplierName(): string {
    return 'Erc';
  }

  private getIsRrcRequired() {
    return true
  }

  public async getUnifiedProducts(): Promise<UnifiedProduct[]> {

    try {

      // Here will be logic to fetch products from concrete (Erc) supplier
      // And format the products to the unified products type

      const {
        ERC_CONTENT_API_USERNAME,
        ERC_CONTENT_API_PASSWORD,
        ERC_CONNECT_SERVICE_API_USERNAME,
        ERC_CONNECT_SERVICE_API_PASSWORD,
      } = process.env ?? {}

      if (!ERC_CONTENT_API_USERNAME || !ERC_CONTENT_API_PASSWORD) {
        throw new Error(`ERC_CONTENT_API login/password were not found`)
      }

      if (!ERC_CONNECT_SERVICE_API_USERNAME || !ERC_CONNECT_SERVICE_API_PASSWORD) {
        throw new Error(`ERC_CONNECT_SERVICE_API login/password were not found`)
      }

      const ercContentApi = new ErcContentApi(
        ERC_CONTENT_API_USERNAME,
        ERC_CONTENT_API_PASSWORD
      )

      const ercConnectServiceApi = new ErcConnectServiceApi(
        ERC_CONNECT_SERVICE_API_USERNAME,
        ERC_CONNECT_SERVICE_API_PASSWORD
      )

      const usdRates = await ercConnectServiceApi.getRates()

      if (usdRates?.IsError) {
        throw new Error(`ERC error fetching USD rates: response is ${JSON.stringify(usdRates)}`)
      }

      const usdRate = usdRates.paperwork

      if (!usdRate) {
        throw new Error(`ERC USD rate (paperwork) is not valid: ${usdRate}`)
      }

      const connectServiceProducts = await ercConnectServiceApi.getProducts()

      if (!connectServiceProducts.length) {
        throw new Error(`ERC connectServiceProducts array is empty`)
      }

      const wareRuProducts = await ercContentApi.getProductsRu()

      if (!wareRuProducts.length) {
        throw new Error(`ERC wareRuProducts array is empty`)
      }

      const currentDate = new Date()

      const parsedUnifiedProducts: UnifiedProduct[] = []

      wareRuProducts.forEach((wareRuProduct) => {

        const sku = wareRuProduct?.sku[0]?.code

        if (!sku) return

        const foundConnectionServiceProduct = connectServiceProducts
          .find(connectServiceProduct => (
            sku === connectServiceProduct?.code
          ))

        if (!foundConnectionServiceProduct) return

        const costPrice = foundConnectionServiceProduct?.sprice

        if (!costPrice) return

        const isCostPriceInUsd = foundConnectionServiceProduct.ddp === 0

        const costPriceUah = isCostPriceInUsd ?
          Math.round(costPrice * usdRate) :
          costPrice

        const isRrcRequired = this.getIsRrcRequired()

        const title = wareRuProduct?.title ?? ''

        const availability = foundConnectionServiceProduct?.stock ?? false

        const link = wareRuProduct?.url || null

        const supplierName = this.getSupplierName()

        const imgLink = wareRuProduct?.image || null

        const rrcValue = foundConnectionServiceProduct?.RRP_UAH ?? 0

        parsedUnifiedProducts.push({
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

export {ErcApiImplementation}
