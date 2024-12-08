import {collections, dbName, getConnection} from "../mongo";
import {
  WithCreatedAt,
  WithUpdatedAt,
  ErcApiConnectServiceProduct,
  ErcApiConnectServiceUsdRateWithDocName,
  ErcApiContentProduct,
  ErcUnifiedProductsResult
} from "../../types";

const erc = {
  getUnifiedProducts: async (): Promise<ErcUnifiedProductsResult> => {

    const mongo = await getConnection();
    const db = mongo.db(dbName);

    const apiProducts = await db
      .collection<WithCreatedAt<WithUpdatedAt<ErcApiContentProduct>>>
      (collections.erc.content)
      .find()
      .toArray();

    const apiConnectServiceProducts = await db
      .collection<WithCreatedAt<WithUpdatedAt<ErcApiConnectServiceProduct>>>
      (collections.erc.specprice)
      .find()
      .toArray();

    const usdRates = await db
      .collection<WithUpdatedAt<ErcApiConnectServiceUsdRateWithDocName>>
      (collections.erc.rates)
      .findOne({docName: 'main'});

    const result: ErcUnifiedProductsResult = {
      usdRates: usdRates,
      unifiedProducts: []
    }

    for (const apiProduct of apiProducts) {

      const apiProductKey = apiProduct?.sku?.[0]?.code

      if (!apiProductKey) continue

      const foundInConnectService = apiConnectServiceProducts
        .find(csProduct => {

          const csProductKey = csProduct?.code

          if (!csProductKey) return false

          return apiProductKey === csProductKey
        })

      if (!foundInConnectService) continue

      result.unifiedProducts.push({
        wareProduct: apiProduct,
        connectServiceProduct: foundInConnectService
      })
    }

    return result
  }
}

export {erc}
