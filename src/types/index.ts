import {Collection, WithId} from "mongodb";

// Все поля типа становятся опциональными, кроме одного
// Example
// type testUpsert = OptionalExceptFor<testUpsert, "sku" | "stock">;
type OptionalExceptFor<T, K extends keyof T> = Partial<Omit<T, K>> & Pick<T, K>;

type WithCreatedAt<T> = T & {created_at: Date}

type WithUpdatedAt<T> = T & {updated_at: Date}

// ЕРЦ - Данные с парсера поставщиков
type ErcWareProduct = {
  id: number;
  isNewWareErc: boolean;
  lastChangeDate: string;
  lastChangeTimestamp: number;
  vendor: {
    id: number;
    title: string;
    logo: string;
  };
  description: string;
  descriptionFull: string | null;
  sku: { code: string }[]; // Embedded Sku directly as an object
  url: string;
  ercRrcPrice: number;
  oldPrice: number;
  title: string;
  groups: {
    id: number;
    title: string;
    items: {
      id: number;
      title: string;
      primary: boolean;
      type: string;
      value: {
        id: number;
        value: string;
      }[];
    }[]; // Items can be further defined if needed
  }[];
  image: string;
  images: {
    src: string;
  }[]; // Embedded images as an array of objects
  videos: string[]; // Array of video URLs (empty array in this case)
  erc3dFiles: string[]; // Array of 3D file URLs (empty array in this case)
  categoryId: number;
  wareGroupId: number;
  ercWeight: string;
  ercLength: number;
  ercHeight: number;
  ercWidth: number;
  ercVolume: string;
  ercWarranty: number;
  ercWarrantyUnit: number;
  ercWarrantyUnitHuman: string;
  amount: string;
  draftImage: boolean;
  energyEfficiencyClass: string | null;
  energyEfficiencyClassStickerLink: string | null;
  energyEfficiencyIconColor: string | null;
  isEnableRichContent: boolean;
  richStyle: string | null;
  richContentUk: string | null;
  richContentEn: string | null;
  feature: string | null;
  isNew: boolean;
  isMadeInUkraine: boolean;
  isCustomBadge: boolean;
  customBadgeColor: string | null;
  customBadgeText: string | null;
};

// ЕРЦ - Данные с парсера поставщиков
type ErcConnectServiceProduct = {
  id: string;
  vendorId: string;
  vendor: string;
  categoryId: string;
  category: string;
  subCategoryId: string;
  subcategory: string;
  code: string;
  gname: string;
  sprice: number;
  promoRIC: number;
  datefrom: string | null;
  dateto: string | null;
  ddp: number;
  vat: number;
  pic: string;
  ean: string;
  bar: string;
  upc: string;
  declar: string | null;
  tnvd: string;
  cert: string | null;
  warr: number;
  warrunit: string;
  width: number;
  height: number;
  depth: number;
  weight: number;
  volume: number;
  RRP_UAH: number;
  monitor: boolean;
  serialControl: boolean;
  isaction: number;
  country: string;
  whs: {
    id: number;
    q: string;
  }[];
  stock: boolean;
  reserve: number;
  quantityinbox: number;
  isNewWare: boolean;
  isAllreadyExistWare: boolean;
  isNotmakingWare: boolean;
  isTransitU: boolean;
  isTransitW: boolean;
  isTransitY: boolean;
  actions: string;
  isMarked: boolean;
};

// ЕРЦ - Данные с парсера поставщиков
type ErcConnectServiceUsdRate = {
  paperwork: number;
  cash: number;
  setoff: number;
  ErrorCode?: number;
  IsError?: boolean;
  ResultMessages?: string;
};

// Спарсенные товары (унифицированные)
type ParsedUnifiedProduct = {
  sku: string,
  title: string,
  cost_price_uah: number,
  availability: boolean,
  rrc: {
    value: number;
    is_required: boolean;
  },
  link: string | null,
  supplier_name: string,
  img_link: string | null;
}

// Правила наценки Клипсы
type RulePriceClipsa = {
  cost_price_from: number,
  cost_price_to: number,
  value: number
}

// Доп наценки Клипсы
type DopNacClipsa = {
  sku: string,
  value: number
}

// Товары в СРМ
type CrmProduct = {
  sku: string,
  cost_price: number,
  stock: number
}

// Товары на складе
type StockProduct = {
  sku: string,
  title: string
}

// Себестоимости и наличие товаров на складе
type CostAndAvailabilityStockProduct = {
  sku: string,
  cost_price: number,
  availability: boolean
}

// Связи
type ConnectionProduct = {
  stock_sku: string,
  parsed_sku: string,
  supplier_name: string
}

// Товары на сайте Клипса
type ClipsaProduct = {
  sku: string,
  old_price: number,
  sell_price: number,
  sell_price_components: {
    cost_price: number,
    nacenka_formula: number,
    nacenka_dop: number
  },
  rrc: {
    required: boolean,
    value: number
  },
  availability: boolean,
  hidden: boolean,
  suppliers: {
    supplier_name: string,
    sku: string
  }[]
}

type BafCalculatedProduct = {
  sku: string;
  supplier_name: string;
  name: string;
  id: string;
  cost_price: number;
  availability: boolean;
};

// Товары в СРМ (старая разделенная коллекция)
type CrmProductOld = {
  sku: string,
  costPrice: number,
  stock: number
}

// старое, но Игорь просил в этом формате
/*type ContentCalculatedProduct = {
  supplier: {
    name: string,
    product_id: string,
    product_sku: string
  }
  sku: string,
  cost_price: number,
  availability: 'В наличии' | 'Нет в наличии' | 'Скрыт',
  sell_price: number,
  old_price: number
}*/

type DocTypeByCollectionType<V> = V extends Collection<infer T> ? T : never;

type IUpdateClipsaDopNacenkaResBody = {
  sku: string,
  sell_price: number
}

type IUpdateClipsaDopNacenkaReqBody = {
  sku: string,
  dop_nac: number
}

export {
  WithId,
  WithCreatedAt,
  WithUpdatedAt,
  IUpdateClipsaDopNacenkaResBody,
  IUpdateClipsaDopNacenkaReqBody,
  DocTypeByCollectionType,
  OptionalExceptFor,
  ErcWareProduct,
  ErcConnectServiceProduct,
  ErcConnectServiceUsdRate,
  CrmProductOld,
  ParsedUnifiedProduct,
  RulePriceClipsa,
  DopNacClipsa,
  CrmProduct,
  StockProduct,
  CostAndAvailabilityStockProduct,
  ConnectionProduct,
  ClipsaProduct,
  BafCalculatedProduct
};
