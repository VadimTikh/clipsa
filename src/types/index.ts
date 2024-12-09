import {WithId} from "mongodb";

type WithCreatedAt<T> = T & {
  createdAt: Date;
}

type WithUpdatedAt<T> = T & {
  updatedAt: Date;
}

type ParsedUnifiedProduct = {
  sku: string,
  title: string,
  cost_price_uah: number,
  availability: boolean,
  rrc_price_uah: number | null,
  link: string | null,
  supplier_name: string,
  createdAt: Date;
  updatedAt: Date;
  img_link: string | null;
  ___connection_stock: {
    stock_sku: string | null,
    note: string | null
  }
}

type StockParsedProduct = {
  stock: WithId<StockProduct>,
  parsing: WithId<ParsedUnifiedProduct>[]
}

type StockProduct = {
  sku: string,
  title: string,
  cost_price_uah: number,
  stock: number,
  createdAt: Date
}

type SiteClipsaProduct = {
  stock_sku: string,
  id: number,
  title: string,
  old_price: number,
  sell_price: number,
  sell_price_components: {
    is_using_rrc: boolean,
    rrc: number | null,
    cost_price: number,
    nacenka_formula: number,
    nacenka_dop: number,
  },
  availability: boolean,
  hidden: boolean
}

type ErcApiContentProduct = {
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

type ErcApiConnectServiceProduct = {
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

type ErcApiConnectServiceUsdRate = {
  paperwork: number;
  cash: number;
  setoff: number;
  ErrorCode?: number;
  IsError?: boolean;
  ResultMessages?: string;
};

type ErcApiConnectServiceUsdRateWithDocName = ErcApiConnectServiceUsdRate & {
  docName: 'main';
};

type ErcUnifiedProductsResult = {
  unifiedProducts: {
    wareProduct: WithCreatedAt<WithUpdatedAt<ErcApiContentProduct>>,
    connectServiceProduct: WithCreatedAt<WithUpdatedAt<ErcApiConnectServiceProduct>>
  }[],
  usdRates: WithUpdatedAt<ErcApiConnectServiceUsdRateWithDocName> | null
}

type BafCalculatedProduct = {
  supplier_name: string;
  name: string;
  id: string;
  sku: string;
  cost_price: number;
  availability: boolean;
};

type ContentCalculatedProduct = {
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
}

export {
  WithCreatedAt,
  WithUpdatedAt,
  ParsedUnifiedProduct,
  StockProduct,
  StockParsedProduct,
  SiteClipsaProduct,
  ErcApiContentProduct,
  ErcApiConnectServiceProduct,
  ErcApiConnectServiceUsdRate,
  ErcApiConnectServiceUsdRateWithDocName,
  ErcUnifiedProductsResult,
  BafCalculatedProduct,
  ContentCalculatedProduct
};
