import {IDatabase, SupplierApiImplementation} from "../../lib/interfaces";
import {SuppliersApiAbstraction} from "../../lib/suppliers";
import {DatabaseMongo} from "../../lib/databases";

type SaveToMongoUnifiedProductsParams = {
  suppliersToSave: SupplierApiImplementation[],
  onSuccessCallback?: (supplierName: string) => void,
  onErrorCallback?: (supplierName: string, reason: any) => void,
}

type UpsertProductsToSalesdriveParams = {

}

const handlers = {

  saveToMongoUnifiedProducts: (
    {
      suppliersToSave,
      onSuccessCallback = () => {
      },
      onErrorCallback = () => {
      },
    }: SaveToMongoUnifiedProductsParams
  ): void => {

    const databaseMongo: IDatabase = new DatabaseMongo()

    const suppliersApiAbstraction = new SuppliersApiAbstraction(
      suppliersToSave,
      databaseMongo
    )

    const suppliersPromises = suppliersApiAbstraction
      .saveProductsToDb()

    suppliersPromises
      .forEach((supplierPromises, i) => {

        const supplierName = suppliersToSave[i].getSupplierName()

        supplierPromises
          .then(() => {
            onSuccessCallback(supplierName)
          })
          .catch((reason: any) => {
            onErrorCallback(supplierName, reason)
          })

      })
  },

  upsertProductsToSalesdrive: () => {


  }
}

export {handlers}
