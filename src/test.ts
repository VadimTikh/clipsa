require('dotenv').config();
import {handlers} from './lib/handlers'

const testing = async () => {
  try {
    await handlers.crons.suppliers.erc.saveConnectServiceProductsToDb()
  } catch (error) {
    console.error(error)
  }
}

testing()
