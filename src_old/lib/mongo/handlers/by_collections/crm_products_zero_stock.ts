import {getConnection} from "../../connection";
import {collections} from "../../collections";
import {log} from "../../../log";

const crm_products_zero_stock = {

  getProducts: async () => {

    try {

      const client = await getConnection();

      const collection = collections.crm.products_zero_stock(client)

      const products = await collection.find({}).toArray()

      log.dev(`crm_products_zero_stock.getProducts fetched: ${products.length} products`);

      return products;

    } catch (error) {
      log.all(`Ошибка crm_products.getProducts`)
      throw error
    }

  }

}

export {crm_products_zero_stock}
