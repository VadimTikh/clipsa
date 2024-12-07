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
  sku: {code: string}[]; // Embedded Sku directly as an object
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
};

type ErcApiConnectServiceUsdRateWithDocName = {
  paperwork: number;
  cash: number;
  setoff: number;
  docName: 'main';
};

type BafCalculatedProduct = {
  supplier_name: string;
  name: string;
  id: string;
  sku: string;
  cost_price: number;
  availability: boolean;
};

type ContentCalculatedProduct = {
  post_name: string,
  post_product_id: string,
  post_product_sku: string,
  sku: string,
  cost_price: number,
  availability: 'В наличии' | 'Нет в наличии' | 'Скрыт',
  sell_price: number,
  old_price: number
}

export {
  ErcApiContentProduct,
  ErcApiConnectServiceProduct,
  ErcApiConnectServiceUsdRate,
  ErcApiConnectServiceUsdRateWithDocName,
  BafCalculatedProduct,
  ContentCalculatedProduct
};
