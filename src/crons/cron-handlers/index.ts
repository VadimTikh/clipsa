import saveToMongoUnifiedProducts from "./utils/saveToMongoUnifiedProducts";
import upsertProductsToSalesDrive from "./utils/upsertProductsToSalesDrive";
import {log} from "../../lib/log";
import {SupplierApiImplementation} from "../../lib/interfaces";
import {ErcApiImplementation, YugcontractApiImplementation} from "../../lib/suppliers";

const handlers = {

  saveToMongoUnifiedProducts: () => {

    log.all('Cron job "Сохранить в БД актуальную информацию о товарах поставщиков" started');

    const suppliersToSave: SupplierApiImplementation[] = [
      new YugcontractApiImplementation(),
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

  upsertProductsToSalesDrive: () => {

    log.all('Cron job "Обновить и добавить товары в СРМ со склада" started');

    const onSuccessCallback = () => {
      log.all(
        `Обновление и добавление товаров в СРМ со склада выполнено успешно!`
      )
    }

    const onErrorCallback = (reason: any) => {
      log.all(
        `Обновление и добавление товаров в СРМ со склада прервано с ошибкой:\n${reason}`
      )
    }

    upsertProductsToSalesDrive({
      onSuccessCallback,
      onErrorCallback
    })
  }
}

export {handlers}
