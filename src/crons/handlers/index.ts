import saveToMongoUnifiedProducts from "./utils/saveToMongoUnifiedProducts";
import {log} from "../../lib/log";
import {SupplierApiImplementation} from "../../lib/interfaces";
import {ErcApiImplementation} from "../../lib/suppliers";

type UpsertProductsToSalesdriveParams = {}

const handlers = {

  saveToMongoUnifiedProducts: () => {

    log.all('Cron job "Сохранить в БД актуальную информацию о товарах поставщиков" started');

    const suppliersToSave: SupplierApiImplementation[] = [
      new ErcApiImplementation()
    ]

    const onSuccessCallback = (supplierName: string) => {
      log.all(
        `Поставщик ${supplierName}: товары сохранены в БД!`
      )
    }

    const onErrorCallback = (supplierName: string, reason: any) => {
      log.all(
        `Поставщик ${supplierName}: сохранение товаров в БД прервано из за ошибки:\n${reason}`
      )
    }

    saveToMongoUnifiedProducts(
      {
        suppliersToSave, onSuccessCallback, onErrorCallback
      }
    )

  },

  upsertProductsToSalesdrive: () => {


  }
}

export {handlers}
