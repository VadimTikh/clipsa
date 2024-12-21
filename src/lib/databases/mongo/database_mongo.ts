import {getConnection} from './getConnection';
import {collections} from "./collections";
import {IDatabase, UnifiedProduct} from "../../interfaces";
import {MongoClient, Filter} from "mongodb";
import {log} from '../../log'

class DatabaseMongo implements IDatabase {

  constructor() {
  }

  private async getClient(): Promise<MongoClient> {
    return await getConnection()
  }

  async getUnifiedProducts(
    options?: { supplierName?: string }
  ): Promise<UnifiedProduct[]> {

    log.dev(`Getting unified products...`)

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
  }

  async updateUnifiedProduct(product: UnifiedProduct): Promise<void> {

    log.dev(`Updating unified product with sku ${product.sku}...`)

    if (!product?.sku) {
      throw new Error(`Product not found by SKU ${JSON.stringify(product)}`)
    }

    const client = await this.getClient()

    const collection = collections
      .products
      .unified(client)

    await collection.updateOne(
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
          updated_at: new Date()
        }
      }
    )
  }

  async insertUnifiedProduct(product: UnifiedProduct): Promise<void> {

    log.dev(`Inserting unified product with sku ${product.sku}...`)

    const date = new Date();

    if (!product?.sku) {
      throw new Error(`Product not found by SKU ${JSON.stringify(product)}`)
    }

    const client = await this.getClient()

    const collection = collections
      .products
      .unified(client)

    await collection.insertOne({
      ...product,
      created_at: date,
      updated_at: date
    })
  }
}
