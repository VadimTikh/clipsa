import {getConnection} from './getConnection';
import {collections} from "./collections";
import {
  IDatabase, UnifiedProduct, CrmProduct, StockProduct, PriceRule, DopNacenka
} from "../../interfaces";
import {MongoClient, Filter, WithId} from "mongodb";
import {log} from '../../log'

class DatabaseMongo implements IDatabase {

  private async getClient(): Promise<MongoClient> {
    return await getConnection()
  }

  async getUnifiedProducts(
    options?: {
      supplierName?: string,
      info_status?: UnifiedProduct['stock_info']['status'],
      stock_sku?: string[]
    }
  ): Promise<WithId<UnifiedProduct>[]> {

    try {

      log.dev(`Getting unified products of ${options?.supplierName || 'all suppliers'}...`)

      const client = await this.getClient()

      const collection = collections
        .products
        .unified(client)

      const filter: Filter<WithId<UnifiedProduct>> = {}

      if (options?.supplierName) {
        filter.supplier_name = options.supplierName
      }

      if (options?.info_status) {
        filter["stock_info.status"] = options.info_status
      }

      if (options?.stock_sku) {
        filter["stock_info.stock_sku"] = {$in: options.stock_sku}
      }

      return await collection
        .find(filter)
        .toArray()

    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const fullError = `Получение из монго БД унифицированных товаров с параметрами: ${
        options ? JSON.stringify(options) : 'без параметров'
      } прервано с ошибкой:\n${
        errorMessage
      }`
      log.all(fullError)
      throw fullError
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
      const fullError = `Обновление в монго БД товара: ${
        JSON.stringify(product)
      } прервано с ошибкой ${errorMessage}`
      log.all(fullError)
      throw fullError
    }
  }

  async makeSupplierProductsUnavailable(
    supplierName: string
  ): Promise<number> {

    try {

      log.dev(`Making all ${supplierName} unified products unavailable...`)

      const client = await this.getClient()

      const collection = collections
        .products
        .unified(client)

      const result = await collection.updateMany(
        {
          supplier_name: supplierName,
          availability: true
        },
        {
          $set: {availability: false}
        }
      )

      return result.modifiedCount

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const fullError = `Перевод в "Нет в наличии" товаров поставщика ${
        supplierName
      } прерван с ошибкой:\n${errorMessage}`
      log.all(fullError)
      throw fullError
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
      const fullError = `Добавление в монго БД товара: ${
        JSON.stringify(product)
      } прервано с ошибкой ${errorMessage}`
      log.all(fullError)
      throw fullError
    }
  }

  async getCrmProducts(): Promise<WithId<CrmProduct>[]> {

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
      const fullError = `Получение из монго БД товаров СРМ прервано с ошибкой:\n${
        errorMessage
      }`
      log.all(fullError)
      throw fullError
    }

  }

  async getStockProducts(): Promise<WithId<StockProduct>[]> {

    try {

      log.dev(`Getting all stock products...`)

      const client = await this.getClient()

      const collection = collections
        .products
        .stock(client)

      const filter: Filter<WithId<StockProduct>> = {}

      return await collection
        .find(filter)
        .toArray()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const fullError = `Получение из монго БД товаров склада прервано с ошибкой:\n${
        errorMessage
      }`
      log.all(fullError)
      throw fullError
    }
  }

  async getPriceRules(options?: { site?: PriceRule["site"] }): Promise<WithId<PriceRule>[]> {

    try {

      log.dev(`Getting all price rules...`)

      const client = await this.getClient()

      const collection = collections
        .priceRules(client)

      const filter: Filter<WithId<PriceRule>> = {}

      if (options?.site) {
        filter.site = options.site
      }

      return await collection
        .find(filter)
        .toArray()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const fullError = `Получение из монго БД правил цен с параметрами: ${
        options ? JSON.stringify(options) : 'без параметров'
      } прервано с ошибкой:\n${
        errorMessage
      }`
      log.all(fullError)
      throw fullError
    }
  }

  async getDopNacenki(): Promise<WithId<DopNacenka>[]> {

    try {

      log.dev(`Getting all doc nacenki...`)

      const client = await this.getClient()

      const collection = collections
        .products
        .dopNacenki(client)

      const filter: Filter<WithId<DopNacenka>> = {}

      return await collection
        .find(filter)
        .toArray()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const fullError = `Получение из монго БД доп наценок прервано с ошибкой:\n${
        errorMessage
      }`
      log.all(fullError)
      throw fullError
    }
  }

  async upsertClipsaDopNacenka(dopNacenka: DopNacenka): Promise<void> {

    try {

      log.dev(`Upserting dop nacenka ${JSON.stringify(dopNacenka)}...`)

      const client = await this.getClient()

      const collection = collections
        .products
        .dopNacenki(client)

      await collection.updateOne(
        {
          site: dopNacenka.site,
          sku: dopNacenka.sku,
        },
        {
          $set: {
            dopNacenka: dopNacenka.dopNacenka
          }
        },
        {
          upsert: true
        }
      )

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const fullError = `Обновление в монго БД доп наценки: ${
        JSON.stringify(dopNacenka)
      } прервано с ошибкой ${errorMessage}`
      log.all(fullError)
      throw fullError
    }
  }
}

export {DatabaseMongo}
