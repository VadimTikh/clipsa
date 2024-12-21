import {
  IDatabase,
  UnifiedProduct,
  SupplierApiImplementation
} from "../interfaces";
import {log} from "../log";

class SuppliersApiAbstraction {

  public constructor(
    private suppliersApi: SupplierApiImplementation[],
    private database: IDatabase,
  ) {
  }

  private isProductChanged(
    {dbProduct, apiProduct}: {
      dbProduct: UnifiedProduct, apiProduct: UnifiedProduct
    }
  ) {

    try {
      const fieldsToCheck: (keyof UnifiedProduct)[] = [
        'title',
        'rrc_is_required',
        'rrc_value',
        'link',
        'img_link',
        'availability',
        'cost_price_uah',
      ];

      return fieldsToCheck
        .some(field => dbProduct[field] !== apiProduct[field]);

    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.all(
        `При сверке абстракцией изменений товаров (между БД и поставщиков) с параметрами:\n` +
        `dbProduct: ${JSON.stringify(dbProduct)}\n` +
        `apiProduct: ${JSON.stringify(apiProduct)}\n` +
        `возникла ошибка:\n${errorMessage}`
      )
      throw error
    }
  }

  private async productsFromApiHandler(
    {
      supplierName,
      productsFromApi,
      database
    }: {
      supplierName: string;
      productsFromApi: UnifiedProduct[];
      database: IDatabase;
    }
  ) {

    try {

      const productsFromDb: UnifiedProduct[] = await database
        .getUnifiedProducts({supplierName})

      const productsNew: UnifiedProduct[] = []
      const productsChanged: UnifiedProduct[] = []
      const productsNotFound: UnifiedProduct[] = []

      // Fill arrays New and Changed in supplier API
      productsFromApi.forEach(productFromApi => {

        const foundInDb = productsFromDb
          .find(productFromDb => (
            productFromDb.sku === productFromApi.sku
          ))

        if (!foundInDb) {
          productsNew.push(productFromApi)
          return
        }

        const isProductChanged = this.isProductChanged({
          dbProduct: foundInDb,
          apiProduct: productFromApi
        })

        if (isProductChanged) {
          productsChanged.push(productFromApi)
        }
      })

      //Fills array NotFound in supplier API
      productsFromDb.forEach(productsFromDb => {

        const foundInApi = productsFromApi
          .find(productFromApi => (
            productFromApi.sku === productsFromDb.sku
          ))

        if (!foundInApi) {
          productsNotFound.push(productsFromDb)
        }
      })

      const insertNewProducts = async () => {
        for (const product of productsNew) {
          await database.insertUnifiedProduct(product)
        }
      }

      const updateChangedProducts = async () => {

        for (const product of productsChanged) {
          await database.updateUnifiedProduct(product)
        }

        for (const product of productsNotFound) {

          const productNotAvailable: UnifiedProduct = {
            ...product,
            availability: false
          }
          await database.updateUnifiedProduct(productNotAvailable)
        }

      }

      await Promise.all([
        insertNewProducts(),
        updateChangedProducts()
      ])

    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.all(
        `При формировании абстракцией списка на добавление и обновление в БД товаров с параметрами:\n` +
        `supplierName: ${supplierName}\n` +
        `productsFromApi: ${JSON.stringify(productsFromApi)}\n` +
        `database: ${JSON.stringify(database)}\n` +
        `возникла ошибка:\n${errorMessage}`
      )
      throw error
    }

  }

  /**
   * Save products from all suppliers to the database.
   * Returns an array of promises, each corresponding to a supplier's
   * (in order that were provided in a constructor first param) save operation.
   * This allows independent tracking of each supplier's operation.
   *
   * @returns {Promise<void>[]} Array of promises (for each supplier)
   */
  public saveProductsToDb() {

    try {

      const results: Promise<void>[] = []

      for (const supplierApi of this.suppliersApi) {

        const supplierName = supplierApi.getSupplierName()

        const database = this.database

        const save = async () => {

          const productsFromApi = await supplierApi.getUnifiedProducts();

          await this.productsFromApiHandler({
            supplierName,
            productsFromApi,
            database,
          });
        }

        const result = save()

        results.push(result)
      }

      return results

    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.all(
        `При фетчинге и сохранении абстракцией товаров в БД\n` +
        `возникла ошибка:\n${errorMessage}`
      )
      throw error
    }
  }
}

export {SuppliersApiAbstraction}
