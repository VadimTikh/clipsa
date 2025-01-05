import {axios} from "./axios";
import {DontUpdateFields, Product} from "./types";

class SalesDriveApi {
  private readonly form;
  private readonly base_url;
  private routes;

  constructor(form = 'nLY2lNsLw4h_1MpNzpuoxnPIoI6kZasSprNNt0hPJztD0xfiOc2cyi0rb') {
    this.form = form
    this.base_url = 'https://toptech.salesdrive.me';
    this.routes = {
      add_update_products: `${this.base_url}/product-handler/`,
    }
  }

  private async makeRequestWithForm(
    {url, body}:
      {
        url: string,
        body: Record<string, any>,
      }
  ) {

    return axios.post(url, {
      ...body,
      form: this.form,
    })
  }

  /*
  Добавление/обновление товаров
   */
  async upsertProducts(
    {product, dontUpdateFields}: {
      product: Product[]
      dontUpdateFields?: DontUpdateFields[]
    }
  ) {
    const url = this.routes.add_update_products
    const action = 'update'
    const body = {
      action,
      dontUpdateFields: dontUpdateFields ?? [],
      product,
    }

    return await this.makeRequestWithForm({url, body})
  }
}

export {SalesDriveApi}
