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
}

interface SupplierApiImplementation {

  getSupplierName(): string

  getUnifiedProducts(): Promise<UnifiedProduct[]>;
}

export {SupplierApiImplementation, IDatabase, UnifiedProduct}
