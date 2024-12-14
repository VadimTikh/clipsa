import {WithId} from 'mongodb';
import {ErcContentApi} from '../lib/suppliers_api';
import {getConnection, dbNames, collections} from '../lib/mongo';
import {log} from '../lib/log';
import {
  ErcApiContentProduct,
  ErcApiConnectServiceProduct,
  ErcApiConnectServiceUsdRateWithDocName,
  BafCalculatedProduct,
  ContentCalculatedProduct, WithUpdatedAt, WithCreatedAt,
  SiteClipsaProduct,
  StockParsedProduct,
  ParsedUnifiedProduct, StockProduct
} from '../types';
import {ErcConnectServiceApi} from '../lib/suppliers_api/erc';
import {erc, products as productsGetter} from '../lib/handlers'

// Заполнение коллекций сырыми данными от поставщика
const suppliers = {
  erc: {
    parseContentProductsToDb: async () => {

      const date = new Date()

      const ercContentApi = new ErcContentApi();

      const products = await ercContentApi.getProductsContentConcurrent();

      const mongo = await getConnection();

      const collection = mongo
        .db(dbNames.clipsa)
        .collection<
          WithCreatedAt<WithUpdatedAt<ErcApiContentProduct>>
        >(collections.clipsaDb.erc.content);

      const bulkOps = products.map(product => ({
        updateOne: {
          filter: {id: product.id},
          update: {
            $set: {
              ...product,
              updatedAt: date,
            },
            $setOnInsert: {
              createdAt: date,
            }
          },
          upsert: true,
        },
      }));

      const {upsertedCount, modifiedCount} =
        await collection.bulkWrite(bulkOps);

      log(
        `crons suppliers.erc.parseContentProductsToDb upsertedCount is ${upsertedCount}`,
      );

      log(
        `crons suppliers.erc.parseContentProductsToDb modifiedCount is ${modifiedCount}`,
      );
    },
    parseSpecpriceProductsToDb: async () => {
      log('crons suppliers.queries.parseSpecpriceProductsToDb started');

      const date = new Date()

      const ercContentApi = new ErcConnectServiceApi();

      const products = await ercContentApi.getProducts();

      const mongo = await getConnection();

      const collection = mongo
        .db(dbNames.clipsa)
        .collection<
          WithCreatedAt<WithUpdatedAt<ErcApiConnectServiceProduct>>
        >(collections.clipsaDb.erc.specprice);

      const bulkOps = products.map(product => ({
        updateOne: {
          filter: {id: product.code},
          update: {
            $set: {
              ...product,
              updatedAt: date,
            },
            $setOnInsert: {
              createdAt: date,
            },
          },
          upsert: true,
        },
      }));

      const BATCH_SIZE = 500;

      for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
        const batch = bulkOps.slice(i, i + BATCH_SIZE);

        await collection.bulkWrite(batch);

        log(
          `crons suppliers.erc.parseSpecpriceProductsToDb proceeded: ${i + BATCH_SIZE} of ${bulkOps.length}`,
        );
      }
    },
    parseSpecpriceRateUsdToDb: async () => {
      const ercContentApi = new ErcConnectServiceApi();

      const rates = await ercContentApi.getRates();

      const mongo = await getConnection();

      const collection = mongo
        .db(dbNames.clipsa)
        .collection<
          WithUpdatedAt<ErcApiConnectServiceUsdRateWithDocName>
        >(collections.clipsaDb.erc.rates);

      const {upsertedCount, modifiedCount} = await collection.updateOne(
        {docName: 'main'},
        {
          $set: {
            ...rates,
            IsError: rates?.IsError ?? false,
            ErrorCode: rates?.ErrorCode ?? 0,
            ResultMessages: rates?.ResultMessages ?? '',
            updatedAt: new Date(),
          }
        },
        {upsert: true},
      );

      log(
        `crons suppliers.erc.parseSpecpriceRateUsdToDb upsertedCount is ${upsertedCount}`,
      );

      log(
        `crons suppliers.erc.parseSpecpriceRateUsdToDb modifiedCount is ${modifiedCount}`,
      );
    }
  },
};

// Заполнение коллекций кастомными данными товаров
const products = {

  updateUnifiedParsedProductsToDb: async () => {

    const mongo = await getConnection();

    const db = mongo
      .db(dbNames.clipsa)

    const collectionUnifiedParsedProducts = db
      .collection<
        ParsedUnifiedProduct
      >(collections.clipsaDb.products.parsed_unified);

    const getUnifiedProducts = async (): Promise<ParsedUnifiedProduct[]> => {

      const getErcProducts = async (): Promise<ParsedUnifiedProduct[]> => {

        const supplierName = 'ERC'

        const {
          unifiedProducts,
          usdRates
        } = await erc.getUnifiedProducts()

        const usdRate = usdRates?.paperwork

        if (!usdRate) {
          throw new Error('ЕРЦ отсутствует курс доллара usdRates.paperwork')
        }

        return unifiedProducts.map(p => {

          const getCostPriceUah = () => {

            const costPrice = p.connectServiceProduct.sprice

            const isCostPriceInUsd = p.connectServiceProduct.ddp === 0

            const costPriceUah = isCostPriceInUsd ? (
              costPrice * usdRate
            ) : (
              costPrice
            )

            return Math.round(costPriceUah)
          }

          const getUpdatedAt = () => {

            return new Date(
              Math.min(
                p.wareProduct.updatedAt.getTime(),
                p.connectServiceProduct.updatedAt.getTime()
              )
            )
          }

          const getCreatedAt = () => {

            return new Date(
              Math.min(
                p.wareProduct.createdAt.getTime(),
                p.connectServiceProduct.createdAt.getTime()
              )
            )
          }

          return {
            sku: p.connectServiceProduct.code,
            title: p.wareProduct.title,
            cost_price_uah: getCostPriceUah(),
            availability: p.connectServiceProduct.stock,
            updatedAt: getUpdatedAt(),
            createdAt: getCreatedAt(),
            link: p.wareProduct?.url || null,
            supplier_name: supplierName,
            img_link: p.wareProduct?.image || null,
            rrc_price_uah: p?.connectServiceProduct?.RRP_UAH || null,
            ___connection_stock: {
              stock_sku: null,
              note: null
            }
          }
        })
      }

      const [
        ercProducts
      ] = await Promise.all(
        [
          getErcProducts()
        ]
      );

      return [
        ...ercProducts
      ]
    }

    const unifiedProducts = await getUnifiedProducts()

    log(
      `products.updateUnifiedParsedProductsToDb unifiedProducts length is ${unifiedProducts.length}`
    );

    const bulkOps = unifiedProducts.map(product => ({
      updateOne: {
        filter: {
          sku: product.sku,
          supplier_name: product.supplier_name,
        },
        update: {
          $set: {
            title: product.title,
            cost_price_uah: product.cost_price_uah,
            availability: product.availability,
            rrc_price_uah: product.rrc_price_uah,
            link: product.link,
            updatedAt: product.updatedAt,
            img_link: product.img_link,
          },
          $setOnInsert: {
            createdAt: product.createdAt,
            ___connection_stock: product.___connection_stock
          }
        },
        upsert: true,
      },
    }));

    const BATCH_SIZE = 500;

    for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
      const batch = bulkOps.slice(i, i + BATCH_SIZE);

      await collectionUnifiedParsedProducts
        .bulkWrite(batch);

      log(
        `crons products.updateUnifiedParsedProductsToDb proceeded: ${i + BATCH_SIZE} of ${bulkOps.length}`,
      );
    }
  },
}

const baf = {
  calculateProductsToDb: async () => {
    log('Started baf.calculateProductsToDb...');

    const mongo = await getConnection();
    const db = mongo.db(dbNames.clipsa);

    const getProducts = async (): Promise<BafCalculatedProduct[]> => {

      const getLowestCostSupplier = (p: StockParsedProduct) => {

        const availableSuppliers = p
          .parsing
          .filter(par => par.availability)

        if (!availableSuppliers.length) return null

        return availableSuppliers
          .reduce((lowest, supplier) => (
            supplier.cost_price_uah < lowest.cost_price_uah ? supplier : lowest
          ));
      }

      const getAvailability = (
        product: StockParsedProduct, supplier: ParsedUnifiedProduct | null
      ) => {

        return (product.stock.stock > 0 && !!supplier?.availability)
      }

      const getCostPriceByUah = (
        product: StockParsedProduct, supplier: ParsedUnifiedProduct | null
      ) => {

        let cost_price_uah = product.stock.cost_price_uah

        const isStockValid = product.stock.stock > 0

        if (!isStockValid && !!supplier && supplier.availability) {

          cost_price_uah = supplier.cost_price_uah
        }

        return Number(
          (cost_price_uah).toFixed(2)
        )
      }

      const products = await productsGetter.getStockParsedProducts()

      return products
        .map(p => {

          const supplier = getLowestCostSupplier(p)

          const supplier_name = supplier?.supplier_name ?? ''

          const id = String(p.stock._id)

          const sku = p.stock.sku

          const name = p.stock.title

          const cost_price = getCostPriceByUah(p, supplier)

          const availability = getAvailability(p, supplier)

          return {
            id,
            availability,
            cost_price,
            name,
            sku,
            supplier_name
          }
        })
    }

    const products = await getProducts();

    log(`baf.calculateProductsToDb products length is ${products.length}`);

    const bulkOps = products.map(product => ({
      updateOne: {
        filter: {
          sku: product.sku,
          supplier_name: product.supplier_name,
        },
        update: {
          $set: product,
        },
        upsert: true,
      },
    }));

    const BATCH_SIZE = 500;

    for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
      const batch = bulkOps.slice(i, i + BATCH_SIZE);

      await db
        .collection<WithId<BafCalculatedProduct>>(collections.clipsaDb.baf.products)
        .bulkWrite(batch);

      log(
        `crons baf.calculateProductsToDb proceeded: ${i + BATCH_SIZE} of ${bulkOps.length}`,
      );
    }
  },
};

const content = {
  calculateProductsToDb: async () => {
    log('Started products.calculateProductsToDb...');

    const mongo = await getConnection();

    const db = mongo
      .db(dbNames.clipsa)

    const stockCollection = db
        .collection
      < SiteClipsaProduct >
      (
        collections.clipsaDb.products.site_clipsa
      )

    const stockProducts = await stockCollection
      .find({})
      .toArray()

    const getProducts = async (): Promise<ContentCalculatedProduct[]> => {
      return []
    }

  }
}

export {suppliers, products, baf};
