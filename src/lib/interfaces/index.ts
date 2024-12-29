import {WithId} from "mongodb";

export interface UnifiedProduct {
  sku: string,
  title: string,
  cost_price_uah: number,
  availability: boolean,
  rrc_value: number,
  rrc_is_required: boolean,
  link: string | null,
  supplier_name: string,
  img_link: string | null;
  created_at: Date;
  updated_at: Date;
  stock_info:
    | { status: 'linked'; stock_sku: string }
    | { status: 'rejected'; reason: string }
    | { status: 'pending' };
}

export interface StockProduct {
  sku: string,
  title: string,
}

export interface CrmProduct {
  sku: string,
  stock: number,
  costPrice: number,
}

export interface ContentProduct {
  id: string, // Внутренний ID монго бд
  sku: string, // Артикул с нашего склада
  title: string, // Название с нашего склада
  clipsa: {
    sell_price: number, // Цена продажи на сайте
    availability: boolean, // Наличие на сайте
    hidden: boolean, // Видимость на сайте
  }
  current_supplier: {
    supplier_name: string, // Название поставщика
    supplier_sku: string, // Арт поставщика (для каждого поставщика будем оговаривать этот параметр)
  }
}

export interface BafCalculatedProduct {
  sku: string;
  supplier_name: string;
  name: string;
  id: string;
  cost_price: number;
  availability: boolean;
}

export interface PriceRule {
  site: 'Clipsa'
  cost_price_from: number,
  cost_price_to: number,
  nacenka: number
}

export interface DopNacenka {
  site: 'Clipsa'
  sku: string,
  dopNacenka: number
}

export interface IDatabase {

  getUnifiedProducts(
    options?: {
      supplierName?: string,
      info_status?: UnifiedProduct['stock_info']['status']
    }
  ): Promise<WithId<UnifiedProduct>[]>;

  insertUnifiedProduct(
    product: UnifiedProduct
  ): Promise<void>;

  updateUnifiedProduct(
    product: UnifiedProduct,
    updateFields: (keyof UnifiedProduct)[]
  ): Promise<void>;

  getCrmProducts(): Promise<WithId<CrmProduct>[]>

  getStockProducts(): Promise<WithId<StockProduct>[]>

  getPriceRules(options?: {
    site?: PriceRule['site']
  }): Promise<WithId<PriceRule>[]>

  getDopNacenki(): Promise<WithId<DopNacenka>[]>

  upsertClipsaDopNacenka(dopNacenka: DopNacenka): Promise<void>
}

export interface SupplierApiImplementation {

  getSupplierName(): string

  getUnifiedProducts(): Promise<UnifiedProduct[]>;
}
