import {getConnection} from './getConnection';
import {collections} from "./collections";
import {IDatabase, UnifiedProduct, CrmProduct} from "../../interfaces";
import {MongoClient, Filter} from "mongodb";
import {log} from '../../log'

class DatabaseMongo implements IDatabase {

  private async getClient(): Promise<MongoClient> {
    return await getConnection()
  }

  async getUnifiedProducts(
    options?: { supplierName?: string }
  ): Promise<UnifiedProduct[]> {

    try {

      log.dev(`Getting unified products of ${options?.supplierName || 'all suppliers'}...`)

      const client = await this.getClient()

      const collection = collections
        .products
        .unified(client)

      const filter: Filter<UnifiedProduct> = {}

      if (options?.supplierName) {
        filter.supplier_name = options.supplierName
      }

      return await collection
        .find(filter)
        .toArray()

    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.all(
        `Получение из монго БД товаров поставщика: ${
          options?.supplierName || '... всех поставщиков'
        } прервано с ошибкой:\n${
          errorMessage
        }`
      )
      throw error
    }
  }

  async updateUnifiedProduct(
    product: UnifiedProduct,
    updateFields: (keyof UnifiedProduct)[]
  ): Promise<void> {

    try {

      log.dev(`Updating unified product of ${product.supplier_name} with sku ${product.sku}...`)

      if (!product?.sku) {
        throw new Error(`В товаре не найден sku: ${JSON.stringify(product)}`)
      }

      const client = await this.getClient()

      const collection = collections
        .products
        .unified(client)

      const _set: Partial<UnifiedProduct> = {...product};

      const productKeys = Object
        .keys(product) as (keyof UnifiedProduct)[]

      productKeys.forEach(key => {

        if (!updateFields.includes(key)) {
          delete _set[key]
        }
      })

      await collection.updateOne(
        {
          sku: product.sku,
          supplier_name: product.supplier_name
        },
        {
          $set: _set
        }
      )

    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.all(
        `Обновление в монго БД товара: ${
          JSON.stringify(product)
        } прервано с ошибкой ${errorMessage}`
      )
      throw error
    }
  }

  async insertUnifiedProduct(product: UnifiedProduct): Promise<void> {

    try {

      log.dev(`Inserting unified product of ${product.supplier_name} with sku ${product.sku}...`)

      if (!product?.sku) {
        throw new Error(`В товаре не найден sku: ${JSON.stringify(product)}`)
      }

      const client = await this.getClient()

      const collection = collections
        .products
        .unified(client)

      await collection.insertOne(product)

    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.all(
        `Добавление в монго БД товара: ${
          JSON.stringify(product)
        } прервано с ошибкой ${errorMessage}`
      )
      throw error
    }
  }

  async getCrmProducts(): Promise<CrmProduct[]> {

    try {

      log.dev(`Getting all CRM products...`)

      const client = await this.getClient()

      const collectionMinusStock = collections
        .products
        .crmMinusStock(client)

      const collectionPlusStock = collections
        .products
        .crmPlusStock(client)

      const collectionZeroStock = collections
        .products
        .crmZeroStock(client)

      const [
        productsMinusStock,
        productsPlusStock,
        productsZeroStock,
      ] = await Promise.all([
        collectionMinusStock.find().toArray(),
        collectionPlusStock.find().toArray(),
        collectionZeroStock.find().toArray()
      ])

      return [
        ...productsMinusStock,
        ...productsPlusStock,
        ...productsZeroStock
      ]

    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.all(
        `Получение из монго БД товаров СРМ прервано с ошибкой:\n${
          errorMessage
        }`
      )
      throw error
    }

  }
}

export {DatabaseMongo}
