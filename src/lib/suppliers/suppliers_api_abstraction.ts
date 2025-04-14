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
  ): boolean {

    const fieldsToCheck: (keyof UnifiedProduct)[] = [
      'id',
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

      const dbProductsMap = new Map(
        productsFromDb.map((product) => [product.sku, product])
      );

      const productsNew: UnifiedProduct[] = []
      const productsChanged: UnifiedProduct[] = []
      const productsNotFound: UnifiedProduct[] = []

      // Fills arrays New and Changed in supplier API
      productsFromApi.forEach(productFromApi => {

        const foundInDb = dbProductsMap
          .get(productFromApi.sku);

        if (!foundInDb) {
          productsNew.push(productFromApi)
          dbProductsMap.delete(productFromApi.sku);
          return
        }

        const isProductChanged = this.isProductChanged({
          dbProduct: foundInDb,
          apiProduct: productFromApi
        })

        if (isProductChanged) productsChanged.push(productFromApi)

        dbProductsMap.delete(productFromApi.sku);
      })

      // Fills array NotFound in supplier API
      dbProductsMap.forEach((productFromDb) => {

        productsNotFound.push({
          ...productFromDb,
          availability: false,
        });
      });

      const insertNewProducts = async () => {
        for (const product of productsNew) {
          await database.insertUnifiedProduct(product)
        }
      }

      const updateChangedProducts = async () => {

        for (const product of productsChanged) {

          const updateFields: (keyof UnifiedProduct)[] = [
            'id',
            'rrc_value',
            'title',
            'availability',
            'link',
            'img_link',
            'rrc_is_required',
            'cost_price_uah',
            'updated_at'
          ]

          await database.updateUnifiedProduct(product, updateFields)
        }

        for (const product of productsNotFound) {

          const updateFields: (keyof UnifiedProduct)[] = [
            'availability'
          ]

          await database.updateUnifiedProduct(product, updateFields)
        }

      }

      await Promise.all([
        insertNewProducts(),
        updateChangedProducts()
      ])

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const fullError = `При формировании абстракцией списка на добавление и обновление в БД товаров с параметрами:\n` +
        `supplierName: ${supplierName}\n` +
        `productsFromApi: ${JSON.stringify(productsFromApi)}\n` +
        `database: ${JSON.stringify(database)}\n` +
        `возникла ошибка:\n${errorMessage}`
      log.all(fullError)
      throw fullError
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
      const fullError = `При фетчинге и сохранении абстракцией товаров в БД\n` +
        `возникла ошибка:\n${errorMessage}`
      log.all(fullError)
      throw fullError
    }
  }
}

export {SuppliersApiAbstraction}
