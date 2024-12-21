import {
  UnifiedProduct,
  SupplierApiImplementation
} from "../interfaces";
import {ErcContentApi, ErcConnectServiceApi} from './erc_api'

class ErcApiImplementation implements SupplierApiImplementation {

  public getSupplierName(): string {
    return 'Erc';
  }

  private getIsRrcRequired() {
    return true
  }

  public async getUnifiedProducts(): Promise<UnifiedProduct[]> {
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
      throw new Error(`ERC error fetching USD rates: error code is ${usdRates?.ErrorCode}`)
    }

    const usdRate = usdRates.paperwork

    if (!usdRate) {
      throw new Error(`ERC USD rate (paperwork) is not valid: ${usdRate}`)
    }

    const wareRuProducts = await ercContentApi.getProductsRu()

    const connectServiceProducts = await ercConnectServiceApi.getProducts()

    if (!wareRuProducts.length) {
      throw new Error(`ERC wareRuProducts array is empty`)
    }

    if (!connectServiceProducts.length) {
      throw new Error(`ERC connectServiceProducts array is empty`)
    }

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
        supplier_name: supplierName
      })
    })

    return parsedUnifiedProducts
  }
}

export {ErcApiImplementation}
