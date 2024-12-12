import axiosBasic from 'axios';
import {log} from '../lib/log';
import {
  ErcApiContentProduct,
  ErcApiConnectServiceProduct,
  ErcApiConnectServiceUsdRate,
} from '../types';

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
    return await this.makeDoExportRequest<ErcApiConnectServiceProduct[]>(
      infotype,
    );
  }

  async getRates() {
    const infotype = 7;
    return await this.makeDoExportRequest<ErcApiConnectServiceUsdRate>(
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

  async getProductsContent(limitPerRequest = 500, maxPages = Infinity) {
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

    log(`Erc fetching products initial data with page ${startPage}`);

    const response = await axios.get(getRoute(startPage), options);

    const data = response?.data as {
      content: ErcApiContentProduct[];
      pagination: { total: number };
    };

    products.push(...data.content);

    const totalProducts = data.pagination.total;

    log(`data.pagination: ${JSON.stringify(data.pagination)}`)

    log(`Erc total products to fetch is ${totalProducts}`);

    const totalPages = Math.min(
      Math.ceil(totalProducts / limitPerRequest),
      maxPages,
    );

    log(`Erc total pages to fetch is ${totalPages}`);

    if (totalPages > startPage) {
      for (let page = startPage + 1; page <= totalPages; page++) {
        log(`Erc fetching page ${page} of ${totalPages}`);

        const response = await axios.get(getRoute(page), options);

        const data = response?.data as { content: ErcApiContentProduct[] };

        products.push(...data.content);
      }
    }

    log(`Erc total fetched products is ${products.length}`);

    return products as ErcApiContentProduct[];
  }

  async getProductsContentSync(limitPerRequest = 500, maxPages = Infinity) {
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

    log(`Erc fetching products initial data with page ${startPage}`);

    const response = await axios.get(getRoute(startPage), options);

    const data = response?.data as {
      content: ErcApiContentProduct[];
      pagination: { total: number };
    };

    products.push(...data.content);

    const totalProducts = data.pagination.total;

    log(`Erc total products to fetch is ${totalProducts}`);

    const totalPages = Math.min(
      Math.ceil(totalProducts / limitPerRequest),
      maxPages,
    );

    log(`Erc total pages to fetch is ${totalPages}`);

    const responses = []

    if (totalPages > startPage) {
      for (let page = startPage + 1; page <= totalPages; page++) {
        log(`Erc fetching page ${page} of ${totalPages}`);

        const response = axios.get(getRoute(page), options);

        responses.push(response)

        response
          .then((value) => {
            console.info(`page ${page} done`)
            return value
          })
          .catch(() => {

            console.error(`page ${page} error`)
            throw new Error(`page ${page} error`)
          })
      }
    }

    const responsesAwaited = await Promise.all(responses)

    responsesAwaited.forEach(response => {

      const data = response?.data as { content: ErcApiContentProduct[] };

      products.push(...data.content);
    })

    log(`Erc total fetched products is ${products.length}`);

    return products as ErcApiContentProduct[];
  }

  async getProductsContentConcurrent(limitPerRequest = 500, maxPages = Infinity, concurrentLimit = 5) {

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

    log(`Erc fetching products initial data with page ${startPage}`);

    const response = await axios.get(getRoute(startPage), options);

    const data = response?.data as {
      content: ErcApiContentProduct[];
      pagination: { total: number };
    };

    products.push(...data.content);

    const totalProducts = data.pagination.total;

    log(`data.pagination: ${JSON.stringify(data.pagination)}`);

    log(`Erc total products to fetch is ${totalProducts}`);

    const totalPages = Math.min(
      Math.ceil(totalProducts / limitPerRequest),
      maxPages,
    );

    log(`Erc total pages to fetch is ${totalPages}`);

    for (let i = startPage + 1; i <= totalPages; i += concurrentLimit) {
      const currentBatch = [];
      for (let j = i; j < i + concurrentLimit && j <= totalPages; j++) {
        log(`Erc preparing fetch for page ${j}`);
        currentBatch.push(axios.get(getRoute(j), options));
      }

      log(`Erc fetching batch of pages from ${i} to ${Math.min(i + concurrentLimit - 1, totalPages)}`);

      const batchResponses = await Promise.all(currentBatch);

      for (const batchResponse of batchResponses) {
        const data = batchResponse?.data as { content: ErcApiContentProduct[] };
        products.push(...data.content);
      }
    }

    log(`Erc total fetched products is ${products.length}`);

    return products as ErcApiContentProduct[];
  }

}


export {ErcContentApi, ErcConnectServiceApi};
