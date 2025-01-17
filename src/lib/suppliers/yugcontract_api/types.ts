// Generic BaseResponse type
type BaseResponse<Content> = {
  method: string;
  status: "ok" | string;
  error: null | string;
  content: Content;
};

export type PriceProduct = {
  // Категорія
  cat_top: string;
  // Код Категорії
  cat_2l: string;
  // Група
  cat: string;
  // Підгрупа
  cat_id: number;
  // Код Підгрупи
  cat_top_id: number;
  // TM
  brand: string;
  // Код
  id: string;
  // Назва UA
  name_ukr: string;
  // Ціна, грн.
  price: number;
  // Ціна за пакування, грн.
  price_scu: number;
  // РРЦ, грн.
  rrp: number;
  // Контроль РРЦ, грн.
  rrp_control: number;
  // Статус наявності
  // Значення: 0 - немає; 1 - в наявності; 2 - у резерві; 3 - очікується; 4 - під запит
  status_main: number;
  // Залишок на складі
  qty_main: number;
  // Статус наявності на складі Київ
  // Значення: 0 - немає; 1 - в наявності; 2 - у резерві; 3 - очікується; 4 - під запит
  status_region_1: string;
  // Статус наявності на складі Київ
  // Значення: 0 - немає; 1 - в наявності; 2 - у резерві; 3 - очікується; 4 - під запит
  status_region_1_code: number;
  // Залишок на складі Київ
  qty_region_1: string;
  // Артикул
  artikul: string,
  // Ссылка на товар
  url: string,
  // Фото
  photo?: string
}

export type AuthGetAuthTokenResponse = BaseResponse<{
  authToken: string
}>;

export type CatalogGetPriceResponse = BaseResponse<{
  data: {
    rests: {
      datetime: string,
      product: PriceProduct[]
    }
  }
}>;
