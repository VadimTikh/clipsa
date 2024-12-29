import cron from 'node-cron';
import {handlers as cronHandlers} from './handlers';
import {log} from '../lib/log';
import {ErcApiImplementation} from "../lib/suppliers";
import {SupplierApiImplementation} from "../lib/interfaces";

// Каждые 4 часа
// Сохранить в БД актуальную информацию о товарах поставщиков
// Во время разработки включено каждую минуту
cron.schedule('* * * * *' /*'0 *!/4 * * *'*/, () => {

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

  cronHandlers
    .saveToMongoUnifiedProducts(
      {
        suppliersToSave, onSuccessCallback, onErrorCallback
      }
    )

  log.all('Cron job "Сохранить в БД актуальную информацию о товарах поставщиков" started');
});
