import {log} from "../../log";
import {AuthGetAuthTokenResponse, CatalogGetPriceResponse} from "./types";
import {axios} from './axios'
import createRequestToken from "./createRequestToken";

class YugcontractApi {
  private readonly user_key;
  private readonly secret;

  private static readonly routes = {
    auth: {
      get_auth_token: `https://auth.yugcontract.ua/api/auth/get-auth-token`
    },
    catalog: {
      get_price: `https://b2b.yugcontract.ua/api/catalog/get-price`,
      catalog: `https://b2b.yugcontract.ua/api/catalog/get-content-goods`
    },
  };

  constructor(user_key: string, secret: string) {
    this.user_key = user_key;
    this.secret = secret;
  }

  private async getAuthToken() {
    try {
      const requestToken = createRequestToken(this.user_key, this.secret);
      const route = YugcontractApi.routes.auth.get_auth_token
      const body = {
        requestToken
      }
      const res = await axios.post<AuthGetAuthTokenResponse>(
        route,
        body
      )

      const authToken = res.data?.content?.authToken ?? null

      if (!authToken) throw new Error('authToken не найден в ответе');

      log.dev(`YugcontractApi fetched authToken`)

      return authToken;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.all(`Не удалось создать auth token для авторизации: ${errorMessage}`)
      throw error
    }

  }

  // В 02:37 ночи почему-то массив продукт возвращался пустым
  public async getProductsPrice() {
    try {
      const authToken = await this.getAuthToken();
      const route = YugcontractApi.routes.catalog.get_price
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
      const body = {
        format: 'json',
        type: 'regular',
        type_prod: ['new'],
        ext_cols: ["artikul", "url","photo"],
      }
      log.dev(`YugcontractApi fetching priceProducts...`)
      const res = await axios.post<CatalogGetPriceResponse>(
        route,
        body,
        {
          headers
        }
      )
      const products = res.data?.content?.data?.rests?.product

      if (!products) throw new Error('product массив не найден в ответе');

      if (!products?.length) throw new Error('product массив пустой в ответе');

      log.dev(`YugcontractApi fetched priceProducts`)

      return products;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.all(`Не удалось выгрузить прайс товаров: ${errorMessage}`)
      throw error
    }
  }
}

export {YugcontractApi}
