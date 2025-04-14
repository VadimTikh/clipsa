import {log} from "../../log";
import {ErcWareProduct} from "./types";
import {axios} from './axios'

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

    try {

      const formData = new FormData();

      formData.append('username', this.username);
      formData.append('password', this.password);

      const route = this.routesV1.auth;

      const res = await axios.post(route, formData);

      const data = res?.data as { token: string };

      if (!data?.token) throw new Error("Erc can't get api token");

      return data.token;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const fullError = `При запросе получения токена ErcContentApi возникла ошибка:\n${errorMessage}`
      log.all(fullError)
      throw fullError
    }
  }

  async getProductsUk(
    limitPerRequest = 500,
    maxPages = Infinity,
    concurrency = 5
  ) {

    try {

      const products = [];

      const startPage = 1;

      const token = await this.getToken();

      const getRoute = (page: number) =>
        `${this.routesV1.ware.uk}?limit=${limitPerRequest}&page=${page}`;

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

        log.dev(`Erc fetching batch of pages from ${i} to ${Math.min(i + concurrency - 1, totalPages)} of total ${totalPages}`);

        const batchResponses = await Promise.all(currentBatch);

        for (const batchResponse of batchResponses) {
          const data = batchResponse?.data as { content: ErcWareProduct[] };
          products.push(...data.content);
        }
      }

      log.dev(`Erc total pages fetched is ${totalPages}, total fetched products is ${products.length}`);

      return products as ErcWareProduct[];

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const fullError = `При запросе получения токена списка ру товаров ErcContentApi с параметрами:\n` +
        `limitPerRequest: ${limitPerRequest}\n` +
        `maxPages: ${maxPages}\n` +
        `concurrency: ${concurrency}\n` +
        `возникла ошибка:\n${errorMessage}`
      log.all(fullError)
      throw fullError
    }
  }

}

export {ErcContentApi}
