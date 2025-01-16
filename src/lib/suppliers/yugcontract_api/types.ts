// Generic BaseResponse type
type BaseResponse<Content> = {
  method: string;
  status: "ok" | string;
  error: null | string;
  content: Content;
};

export type AuthGetAuthTokenResponse = BaseResponse<{
  authToken: string
}>;

export type CatalogGetPriceResponse = BaseResponse<{
  data: {
    rests: {
      datetime: string,
      product: {
        cat_top: string;
        cat_2l: string;
        cat: string;
        cat_id: number;
        cat_top_id: number;
        brand: string;
        id: string;
        name_ukr: string;
        price: number;
        price_scu: number;
        rrp: number;
        rrp_control: number;
        status_main: string;
        qty_main: string;
        status_region_1: string;
        status_region_1_code: number;
        qty_region_1: string;
      }[]
    }
  }
}>;
