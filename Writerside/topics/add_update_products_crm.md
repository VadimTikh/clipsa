# Добавление/обновление товаров в СРМ

**upsertProductsToSalesDrive** - функция для синхронизации товаров с CRM системой Salesdrive

```typescript
const upsertProductsToSalesDrive: UpsertProductsToSalesDrive = async (
  {
    onSuccessCallback = () => {},
    onErrorCallback = () => {}
  }
) => {

  try {
    const {
      productsAddToCrm,
      productsUpdateCostPriceInCrm
    } = await getProducts()

    await addProductsToCrm(productsAddToCrm)

    await updateCostPriceToCrm(productsUpdateCostPriceInCrm)

    onSuccessCallback()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    onErrorCallback(errorMessage)
  }
}
```

## Описание работы функции

В функции `upsertProductsToSalesDrive` выполняются следующие шаги:

1. Из базы данных спарсенных товаров поставщиков берется список товаров, которые:
  - отсутствуют в СРМ и их следует туда добавить (`productsAddToCrm`)
  - присутствуют в СРМ, но имеют отличие в себестоимости, и себестоимость в СРМ следует обновить (`productsUpdateCostPriceInCrm`)

2. Далее вызываются функции для каждого списка:
  - `addProductsToCrm` создает новые товары в СРМ, товары добавляются с помощью API Salesdrive, функция добавляет товары частями, 100 товаров (максимум) за один запрос к СРМ.
  - `updateCostPriceToCrm` обновляет себестоимости товаров в СРМ, обновление происходит с помощью API Salesdrive, также функция обновляет товары частями, 100 товаров (максимум) за один запрос к СРМ.

3. По завершению выполнения, либо в случае возникновения ошибки, вызываются колбеки крон-процесса:
  - `onSuccessCallback()` при успешном выполнении
  - `onErrorCallback(errorMessage)` в случае ошибки, с параметром причины ошибки
