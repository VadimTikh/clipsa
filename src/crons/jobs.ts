import cron from 'node-cron';
import {handlers as cronHandlers} from './handlers';
import {log} from '../lib/log';
import {ErcApiImplementation} from "../lib/suppliers";
import {SupplierApiImplementation} from "../lib/interfaces";

// Каждые 4 часа
// Сохранить в БД актуальную информацию о товарах поставщиков
cron.schedule('0 */4 * * *', () => {

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

  cronHandlers
    .saveToMongoUnifiedProducts(
      {
        suppliersToSave, onSuccessCallback, onErrorCallback
      }
    )
});

// Каждые 15 минут
// Обновить товары в Salesdrive
cron.schedule('0 */1 * * *', () => {
  log.all('test cron every 1 h')
})
