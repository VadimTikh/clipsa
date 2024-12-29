interface UnifiedProduct {
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

interface clipsaContentProduct {
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

interface CrmProduct {
  sku: string,
  stock: number,
  costPrice: number,
}

interface BafCalculatedProduct {
  sku: string;
  supplier_name: string;
  name: string;
  id: string;
  cost_price: number;
  availability: boolean;
};


interface IDatabase {

  getUnifiedProducts(
    options?: {
      supplierName?: string
    }
  ): Promise<UnifiedProduct[]>;

  insertUnifiedProduct(
    product: UnifiedProduct
  ): Promise<void>;

  updateUnifiedProduct(
    product: UnifiedProduct,
    updateFields: (keyof UnifiedProduct)[]
  ): Promise<void>;

  getCrmProducts(): Promise<CrmProduct[]>
}

interface SupplierApiImplementation {

  getSupplierName(): string

  getUnifiedProducts(): Promise<UnifiedProduct[]>;
}

export {SupplierApiImplementation, IDatabase, UnifiedProduct, CrmProduct}
