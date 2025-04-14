import saveToMongoUnifiedProducts from "./utils/saveToMongoUnifiedProducts";
import upsertProductsToSalesDrive from "./utils/upsertProductsToSalesDrive";
import {runWithCallbacks} from "./run_with_callbacks";

const handlers = {

  saveToMongoUnifiedProducts: async () => {
    const name = `Клипса - сохранить в БД актуальную информацию о товарах поставщиков`
    const description = ''
    const handler = saveToMongoUnifiedProducts
    await runWithCallbacks({name, description, handler})
  },

  upsertProductsToSalesDrive: async () => {
    const name = `Клипса - обновить и добавить товары в СРМ со склада`
    const description = ''
    const handler = upsertProductsToSalesDrive
    await runWithCallbacks({name, description, handler})
  },
}

export {handlers}
