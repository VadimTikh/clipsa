import axiosBasic from 'axios';
import {log} from '../log';
import {
  ErcConnectServiceUsdRate,
  ErcWareProduct,
  ErcConnectServiceProduct,
  ParsedUnifiedProduct
} from '../../types';

const axios = axiosBasic.create({})

axios.interceptors.response.use(
  (response) => (
    response
  ), // If response is successful, just return it
  async (error) => {
    const config = error.config;

    // Check if the error qualifies for a retry
    if (error.response && error.response.status >= 500 && error.response.status < 600) {
      config.__retryCount = config.__retryCount || 0;

      if (config.__retryCount < 3) {
        config.__retryCount++;
        console.log(`Retrying request... Attempt #${config.__retryCount}`);

        // Wait for a short delay before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay

        return axios(config); // Retry the request
      }
    }

    // If retries are exhausted, throw the error
    return Promise.reject(error);
  }
);

class ErcConnectServiceApi {
  private readonly username;
  private readonly password;

  private static readonly base_url =
    'https://connect.erc.ua/connectservice/api';

  private static readonly routes = {
    specprice: {
      DoExport: `${this.base_url}/specprice/DoExport`,
    },
  };

  constructor(username = 'ruk.oztoptech.ua@gmail.com', password = '1234') {
    this.username = username;
    this.password = password;
  }

  private async makeDoExportRequest<T>(infotype: number) {
    const url = ErcConnectServiceApi.routes.specprice.DoExport;

    const body = {
      Email: this.username,
      Pass: this.password,
      Infotype: infotype,
      IsJson: true,
    };

    const response = await axios.post<T>(url, body);

    return response.data;
  }

  async getProducts() {
    const infotype = 6;
    return await this.makeDoExportRequest<ErcConnectServiceProduct[]>(
      infotype,
    );
  }

  async getRates() {
    const infotype = 7;
    return await this.makeDoExportRequest<ErcConnectServiceUsdRate>(
      infotype,
    );
  }
}

class ErcContentApi {
  private readonly username;
  private readonly password;
  private readonly base_url;
  private routesV1;

  constructor(username = 'clipsa_com_ua', password = '45XVr1') {
    this.username = username;
    this.password = password;
    this.base_url = 'https://api.erc.ua';
    this.routesV1 = {
      auth: `${this.base_url}/v1/auth`,
      ware: {
        uk: `${this.base_url}/v1/ware/uk`,
        ru: `${this.base_url}/v1/ware/ru`,
      },
    };
  }

  private async getToken() {
    const formData = new FormData();

    formData.append('username', this.username);
    formData.append('password', this.password);

    const route = this.routesV1.auth;

    const res = await axios.post(route, formData);

    const data = res?.data as { token: string };

    if (!data?.token) throw new Error("Erc can't get api token");

    return data.token;
  }

  async getProducts(limitPerRequest = 500, maxPages = Infinity, concurrency = 5) {

    const products = [];

    const startPage = 1;

    const token = await this.getToken();

    const getRoute = (page: number) =>
      `${this.routesV1.ware.ru}?limit=${limitPerRequest}&page=${page}`;

    const options = {
      headers: {
        'X-AUTH-TOKEN': token,
      },
    };

    log.dev(`Erc fetching products initial data with page ${startPage}`);

    const response = await axios.get(getRoute(startPage), options);

    const data = response?.data as {
      content: ErcWareProduct[];
      pagination: { total: number };
    };

    products.push(...data.content);

    const totalProducts = data.pagination.total;

    log.dev(`data.pagination: ${JSON.stringify(data.pagination)}`);

    log.dev(`Erc total products to fetch is ${totalProducts}`);

    const totalPages = Math.min(
      Math.ceil(totalProducts / limitPerRequest),
      maxPages,
    );

    log.dev(`Erc total pages to fetch is ${totalPages}`);

    for (let i = startPage + 1; i <= totalPages; i += concurrency) {
      const currentBatch = [];
      for (let j = i; j < i + concurrency && j <= totalPages; j++) {
        log.dev(`Erc preparing fetch for page ${j}`);
        currentBatch.push(axios.get(getRoute(j), options));
      }

      log.dev(`Erc fetching batch of pages from ${i} to ${Math.min(i + concurrency - 1, totalPages)}`);

      const batchResponses = await Promise.all(currentBatch);

      for (const batchResponse of batchResponses) {
        const data = batchResponse?.data as { content: ErcWareProduct[] };
        products.push(...data.content);
      }
    }

    log.dev(`Erc total fetched products is ${products.length}`);

    return products as ErcWareProduct[];
  }

}

class ErcUnifiedProductCreator {

  public static SUPPLIER_NAME = 'Erc'

  constructor(
    private ercWareProducts: ErcWareProduct[],
    private ercConnectServiceProducts: ErcConnectServiceProduct[],
    private ercConnectServiceUsdRate: ErcConnectServiceUsdRate,
  ) {
  }

  getUnifiedProducts(): ParsedUnifiedProduct[] {

    try {

      const usdRate = this.ercConnectServiceUsdRate.paperwork

      const getCostPriceUah = (
        p: {
          connectServiceProduct: ErcConnectServiceProduct | undefined,
          wareProduct: ErcWareProduct,
        }
      ) => {

        if (!p.connectServiceProduct) return 0

        const costPrice = p.connectServiceProduct.sprice

        const isCostPriceInUsd = p.connectServiceProduct.ddp === 0

        const costPriceUah = isCostPriceInUsd ? (
          costPrice * usdRate
        ) : (
          costPrice
        )

        return Math.round(costPriceUah)
      }

      const getIsRrcRequired = (
        p: {
          connectServiceProduct: ErcConnectServiceProduct | undefined,
          wareProduct: ErcWareProduct,
        }
      ) => {

        return true
      }

      return this.ercWareProducts
        .map(wareProduct => {

          const sku = wareProduct?.sku[0]?.code

          if (!sku) {
            throw new Error(
              `ercWareProducts not found sku ${JSON.stringify(wareProduct)}`
            )
          }

          const connectionProduct = this.ercConnectServiceProducts
            .find(connectionProduct => (
              connectionProduct.code === wareProduct.sku[0].code
            ))

          const p = {
            connectServiceProduct: connectionProduct,
            wareProduct: wareProduct
          }

          return {
            sku: sku,
            title: p?.wareProduct?.title ?? '',
            cost_price_uah: getCostPriceUah(p),
            availability: p?.connectServiceProduct?.stock ?? false,
            link: p.wareProduct?.url || null,
            supplier_name: ErcUnifiedProductCreator.SUPPLIER_NAME,
            img_link: p.wareProduct?.image || null,
            rrc: {
              value: p?.connectServiceProduct?.RRP_UAH ?? 0,
              is_required: getIsRrcRequired(p)
            }
          }
        })

    } catch (error) {
      log.all(`ErcUnifiedProductsCreator.getUnifiedProducts error: ${JSON.stringify(error)}`);
      throw error
    }

  }
}

export {ErcContentApi, ErcConnectServiceApi, ErcUnifiedProductCreator};
