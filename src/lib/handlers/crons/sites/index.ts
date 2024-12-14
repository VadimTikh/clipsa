import {mongoHandler} from "../../../mongo";
import {ClipsaProduct} from "../../../../types";
import {log} from "../../../log";

const sites = {

  saveClipsaProductsToDb: async () => {

    try {

      const DISCOUNT_PERCENT = 15

      const {
        crmProducts,
        connectionsProducts,
        stockProducts,
        clipsaPriceRules,
        parsedUnifiedProducts,
        clipsaDopNacenki
      } = await mongoHandler.combine_queries.getDataForClipsaProducts()

      const oldClipsaSiteProducts = await mongoHandler
        .by_collections
        .site_clipsa_products
        .getProducts()

      const actualClipsaSiteProducts: ClipsaProduct[] = stockProducts
        .map(stockProduct => {

          const sku = stockProduct.sku

          const productCrm = crmProducts
            .find(crm => crm.sku === sku)

          const dopNacenka = clipsaDopNacenki
            .find(d => d.sku === sku)

          const suppliersForSku = connectionsProducts
            .filter(con => (
              con.stock_sku === sku
            ))
            .map(con => {

              return parsedUnifiedProducts
                .find(par => (
                  par.sku === con.parsed_sku &&
                  par.supplier_name === con.supplier_name
                ))
            })
            .filter(supplier => !!supplier)

          const availableSuppliers = suppliersForSku
            .filter(s => s.availability)

          const getBestAvailableSupplier = () => {

            if (!availableSuppliers.length) return null

            return availableSuppliers.reduce((best, current) => {
              return current.cost_price_uah < best.cost_price_uah ? current : best;
            })
          }

          const supplier = getBestAvailableSupplier()

          const getAvailabilityAndCostPrice = () => {

            const result = {
              availability: false,
              cost_price: 0
            }

            if (productCrm && productCrm.stock > 0 && productCrm.cost_price > 0) {
              result.availability = true
              result.cost_price = productCrm.cost_price
            }

            if (supplier && supplier.availability && supplier.cost_price_uah) {
              result.availability = true
              result.cost_price = supplier.cost_price_uah
            }

            return result
          }

          const {
            availability,
            cost_price
          } = getAvailabilityAndCostPrice()

          const getPriceComponents = () => {

            const result = {
              nacenka_formula: 0,
              nacenka_dop: 0
            }

            if (dopNacenka && dopNacenka.value) {
              result.nacenka_dop = dopNacenka.value
            }

            if (cost_price > 0) {

              const foundRule = clipsaPriceRules
                .find(({cost_price_from, cost_price_to}) => {

                  return cost_price_from >= cost_price && cost_price_to <= cost_price
                })

              if (foundRule && foundRule.value > 0) {
                result.nacenka_formula = foundRule.value
              }

            }

            return result
          }

          const {nacenka_formula, nacenka_dop} = getPriceComponents()

          const getSellPrice = () => {

            let sell_price: number = 0

            if (cost_price > 0) sell_price += cost_price

            if (nacenka_formula) sell_price += nacenka_formula

            if (nacenka_dop) sell_price += nacenka_dop

            return sell_price
          }

          const sell_price = getSellPrice()

          if (DISCOUNT_PERCENT > 99) {
            throw new Error('DISCOUNT_PERCENT maximum value is 99')
          }

          const getOldPrice = () => {

            let old_price: number = 0

            if (sell_price > 0) {
              old_price = sell_price / (100 - DISCOUNT_PERCENT)
            }

            return old_price
          }

          const old_price = getOldPrice()

          const getRrc = () => {

            const result = {
              isRrcRequired: false,
              rrcValue: 0
            }

            if (!!supplier) {
              result.isRrcRequired = supplier.rrc.is_required
              result.rrcValue = supplier.rrc.value
            }

            return result
          }

          const {rrcValue, isRrcRequired} = getRrc()

          const getIsHidden = () => {

            return false
          }

          const isHidden = getIsHidden()

          return {
            sku,
            old_price,
            sell_price,
            availability,
            hidden: isHidden,
            sell_price_components: {
              cost_price,
              nacenka_dop,
              nacenka_formula
            },
            rrc: {
              value: rrcValue,
              required: isRrcRequired
            },
            suppliers: availableSuppliers
              .map((supplier) => ({
                supplier_name: supplier.supplier_name,
                sku: supplier.sku
              }))
          }


        })

      const missingClipsaSiteProducts = oldClipsaSiteProducts
        .filter(old => {

          const isExistInActualClipsaSiteProducts = actualClipsaSiteProducts
            .some(actual => (
              actual.sku === old.sku
            ))

          return !isExistInActualClipsaSiteProducts
        })
        .map(missed => {

          return {
            ...missed,
            availability: false
          }
        })

      if (missingClipsaSiteProducts.length) {
        await mongoHandler
          .by_collections
          .site_clipsa_products
          .upsertProducts(missingClipsaSiteProducts)
      }

      await mongoHandler
        .by_collections
        .site_clipsa_products
        .upsertProducts(actualClipsaSiteProducts)

    } catch (error) {
      log.all(`sites.saveClipsaProductsToDb error: ${JSON.stringify(error)}`);
      throw error
    }
  }

}

export {sites}
