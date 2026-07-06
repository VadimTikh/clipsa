import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SuppliersApiAbstraction} from '../src/lib/suppliers';
import {
  IDatabase,
  UnifiedProduct,
  SupplierApiImplementation,
} from '../src/lib/interfaces';
import {WithId} from 'mongodb';

const makeUnifiedProduct = (
  overrides: Partial<UnifiedProduct> = {}
): UnifiedProduct => ({
  id: '1',
  sku: 'SKU-1',
  title: 'Товар',
  availability: true,
  link: null,
  img_link: null,
  cost_price_uah: 100,
  rrc_value: 0,
  rrc_is_required: false,
  supplier_name: 'OkSupplier',
  updated_at: new Date(0),
  created_at: new Date(0),
  stock_info: {status: 'pending'},
  ...overrides,
});

class FakeDatabase implements IDatabase {
  unavailableCalls: string[] = [];
  inserted: UnifiedProduct[] = [];
  unavailableModifiedCount = 5;
  makeUnavailableError: string | null = null;

  async getUnifiedProducts(): Promise<WithId<UnifiedProduct>[]> {
    return [];
  }

  async insertUnifiedProduct(product: UnifiedProduct): Promise<void> {
    this.inserted.push(product);
  }

  async updateUnifiedProduct(): Promise<void> {}

  async getCrmProducts(): Promise<never[]> {
    return [];
  }

  async getStockProducts(): Promise<never[]> {
    return [];
  }

  async getPriceRules(): Promise<never[]> {
    return [];
  }

  async getDopNacenki(): Promise<never[]> {
    return [];
  }

  async upsertClipsaDopNacenka(): Promise<void> {}

  async makeSupplierProductsUnavailable(
    supplierName: string
  ): Promise<number> {
    if (this.makeUnavailableError) {
      throw this.makeUnavailableError;
    }
    this.unavailableCalls.push(supplierName);
    return this.unavailableModifiedCount;
  }
}

class FailingSupplier implements SupplierApiImplementation {
  getSupplierName(): string {
    return 'FailingSupplier';
  }

  async getUnifiedProducts(): Promise<UnifiedProduct[]> {
    throw 'ошибка фетчинга поставщика';
  }
}

class OkSupplier implements SupplierApiImplementation {
  getSupplierName(): string {
    return 'OkSupplier';
  }

  async getUnifiedProducts(): Promise<UnifiedProduct[]> {
    return [makeUnifiedProduct()];
  }
}

test('при ошибке синхронизации товары поставщика переводятся в "Нет в наличии"', async () => {
  const database = new FakeDatabase();

  const abstraction = new SuppliersApiAbstraction(
    [new FailingSupplier(), new OkSupplier()],
    database
  );

  const results = await Promise.allSettled(abstraction.saveProductsToDb());

  // Зануление вызвано только для упавшего поставщика
  assert.deepEqual(database.unavailableCalls, ['FailingSupplier']);

  // Ошибка упавшего поставщика проброшена с припиской о занулении
  assert.equal(results[0].status, 'rejected');
  const reason = String((results[0] as PromiseRejectedResult).reason);
  assert.match(reason, /ошибка фетчинга поставщика/);
  assert.match(reason, /\(5 шт\.\) переведены в "Нет в наличии"/);

  // Успешный поставщик сохранён как обычно
  assert.equal(results[1].status, 'fulfilled');
  assert.equal(database.inserted.length, 1);
  assert.equal(database.inserted[0].supplier_name, 'OkSupplier');
});

test('при успешной синхронизации зануление не вызывается', async () => {
  const database = new FakeDatabase();

  const abstraction = new SuppliersApiAbstraction([new OkSupplier()], database);

  const results = await Promise.allSettled(abstraction.saveProductsToDb());

  assert.equal(results[0].status, 'fulfilled');
  assert.deepEqual(database.unavailableCalls, []);
});

test('ошибка самого зануления дополняет исходную ошибку, а не глотает её', async () => {
  const database = new FakeDatabase();
  database.makeUnavailableError = 'монго недоступна';

  const abstraction = new SuppliersApiAbstraction(
    [new FailingSupplier()],
    database
  );

  const results = await Promise.allSettled(abstraction.saveProductsToDb());

  assert.equal(results[0].status, 'rejected');
  const reason = String((results[0] as PromiseRejectedResult).reason);
  assert.match(reason, /ошибка фетчинга поставщика/);
  assert.match(
    reason,
    /НЕ удалось перевести товары поставщика в "Нет в наличии": монго недоступна/
  );
});
