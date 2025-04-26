# Парсинг поставщиков

**saveToMongoUnifiedProducts** - функция запуска парсинга поставщиков и сохранения товаров в базу данных

```typescript
const saveToMongoUnifiedProducts = (
  {
    onSuccessCallback = () => {},
    onErrorCallback = () => {},
  }: SaveToMongoUnifiedProductsParams
): void => {
  const suppliersToSave: SupplierApiImplementation[] = [
    new YugcontractApiImplementation(),
    new ErcApiImplementation()
  ]
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
}
```

## Описание работы функции

В функции `saveToMongoUnifiedProducts` выполняются следующие шаги:

1. Указывается список инициализированных классов обработчиков поставщиков (`suppliersToSave`), которые соответствуют типу `SupplierApiImplementation`. В данном примере используются классы `YugcontractApiImplementation` и `ErcApiImplementation`.

2. Указывается инициализированный класс базы данных (`databaseMongo`), который соответствует типу `IDatabase`. В данном примере используется класс `DatabaseMongo`.

3. Далее инициализируется универсальный класс-обработчик (`suppliersApiAbstraction`), который принимает обе переменные (`suppliersToSave` и `databaseMongo`).

4. У класса обработчика вызывается метод `saveProductsToDb()`, который запускает парсинг и сохранение в БД товаров каждого поставщика.

5. Далее происходит итерация промисов парсинга каждого поставщика, и по завершению парсинга каждый поставщик вызывает колбек со своим названием для крон-процесса:
  - `onSuccessCallback(supplierName)` при успешном выполнении
  - `onErrorCallback(supplierName, reason)` при возникновении ошибки
