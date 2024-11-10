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

export {ErcApiContentProduct};
