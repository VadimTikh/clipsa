import {getConnection} from './getConnection';
import {collections} from "./collections";
import {IDatabase, UnifiedProduct} from "../../interfaces";
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
    updateFields: (keyof UnifiedProduct)[] //string[]
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

      /*await collection.updateOne(
        {sku: product.sku},
        {
          $set: {
            rrc_value: product.rrc_value,
            title: product.title,
            availability: product.availability,
            link: product.link,
            img_link: product.img_link,
            rrc_is_required: product.rrc_is_required,
            cost_price_uah: product.cost_price_uah,
            updated_at: product.updated_at
          }
        }
      )*/


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
}

export {DatabaseMongo}
