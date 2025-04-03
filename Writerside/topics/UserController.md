# saveToMongoUnifiedProducts
__saveToMongoUnifiedProducts__ - функция запуска парсинга поставщиков и сохранения товаров в базу данных
```typescript
{
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
  }
}
```
