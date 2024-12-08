require('dotenv').config();
import {erc} from "./lib/handlers";

const testing = async () => {
  try {
    const result = await erc.getUnifiedProducts()
    console.log(result)
  } catch (error) {
    console.log(error)
  }
}
testing()
