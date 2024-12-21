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

    const fieldsToCheck: (keyof UnifiedProduct)[] = [
      'title',
      'rrc_is_required',
      'rrc_value',
      'link',
      'img_link',
      'availability',
      'cost_price_uah',
    ];

    return fieldsToCheck.some(field => dbProduct[field] !== apiProduct[field]);
  }

  private async productsFromApiHandler(
    {supplierName, productsFromApi, database}: {
      supplierName: string;
      productsFromApi: UnifiedProduct[];
      database: IDatabase;
    }
  ) {

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

  }

  /**
   * Save products from all suppliers to the database.
   * Returns an array of promises, each corresponding to a supplier's save operation.
   * This allows independent tracking of each supplier's operation.
   *
   * @returns {Promise<void>[]} Array of promises (for each supplier)
   */
  public saveProductsToDb() {

    const results: Promise<void>[] = []

    for (const supplierApi of this.suppliersApi) {

      const supplierName = supplierApi.getSupplierName()

      const database = this.database

      const save = async () => {

        try {

          const productsFromApi = await supplierApi.getUnifiedProducts();
          await this.productsFromApiHandler({
            supplierName,
            productsFromApi,
            database,
          });

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          log.all(`Error saving products for supplier ${supplierName}: ${errorMessage}`);
        }
      }

      const result = save()

      results.push(result)
    }

    return results
  }
}

export {SuppliersApiAbstraction}
