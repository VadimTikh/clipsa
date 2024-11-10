import axios from 'axios';
import {log} from '../lib/log';
import {ErcApiContentProduct} from '../types';

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

    const data = res?.data as {token: string};

    if (!data?.token) throw new Error("Erc can't get api token");

    return data.token;
  }

  async getProducts(limitPerRequest = 200, maxPages = Infinity) {
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
      pagination: {total: number};
    };

    products.push(...data.content);

    const totalProducts = data.pagination.total;

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

        const data = response?.data as {content: ErcApiContentProduct[]};

        products.push(...data.content);
      }
    }

    log(`Erc total fetched products is ${products.length}`);

    return products as ErcApiContentProduct[];
  }
}

export {ErcContentApi};
