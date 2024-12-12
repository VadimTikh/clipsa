require('dotenv').config();
import {products} from "./lib/handlers";

const testing = async () => {
  try {

    const result = await products.getCrmProducts()
    console.info('resulting is')
    console.log(result)
  } catch (error) {
    console.error(error)
  }
}
testing()
