import {CronHandlerParams, IDatabase, SupplierApiImplementation} from "../../../lib/interfaces";
import {ErcApiImplementation, SuppliersApiAbstraction, YugcontractApiImplementation} from "../../../lib/suppliers";
import {DatabaseMongo} from "../../../lib/databases";

const saveToMongoUnifiedProducts = async (
  {
    onStartCallback,
    onSuccessCallback,
    onErrorCallback
  }: CronHandlerParams
) => {
  try {
    if (onStartCallback) onStartCallback()

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

    const results = suppliersToSave.map(supplier => {
      return {
        supplierName: supplier.getSupplierName(),
        errorMessage: ''
      }
    })

    // Create an array of promise handlers
    const promiseHandlers = suppliersPromises.map((supplierPromise, i) => {
      const result = results[i];

      return supplierPromise
        .then(() => {
          return result;
        })
        .catch((reason: any) => {
          console.log(1)
          console.log(reason)
          console.log(1)
          result.errorMessage = JSON.stringify(reason, null, 2)
          return result;
        });
    });

    // Wait for all promises to settle (complete or fail)
    // ТУТ ВСЁ ВЕРНО - Promise.all, т.к. ошибки ловятся .catch
    const settledResults = await Promise.all(promiseHandlers);

    // Check if any suppliers failed
    const isAnySupplierFailed = settledResults
      .some(result => result.errorMessage);

    if (isAnySupplierFailed) {
      // Build status message for all suppliers
      const statusMessages = settledResults.map(result => {
        if (result.errorMessage) {
          return `${result.supplierName}-ошибка ${result.errorMessage}`;
        } else {
          return `${result.supplierName} - ОК`;
        }
      });

      // Combine all messages
      const combinedMessage = statusMessages.join('\n');

      // Throw error to trigger error callback
      throw new Error(combinedMessage);
    }


    if (onSuccessCallback) onSuccessCallback()
  } catch (error) {
    if (onErrorCallback) {
      onErrorCallback(error instanceof Error ? error.message : 'Unknown error')
    }
  }
}

export default saveToMongoUnifiedProducts
