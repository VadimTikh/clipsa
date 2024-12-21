import {ErcConnectServiceProduct, ErcConnectServiceUsdRate} from "./types";
import {axios} from './axios'
import {log} from "../../log";

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

    try {

      const url = ErcConnectServiceApi.routes.specprice.DoExport;

      const body = {
        Email: this.username,
        Pass: this.password,
        Infotype: infotype,
        IsJson: true,
      };

      const response = await axios.post<T>(url, body);

      return response.data;
    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.all(
        `При запросе makeDoExportRequest с параметрами:\n` +
        `infotype: ${infotype}\n` +
        `возникла ошибка:\n${errorMessage}`
      )
      throw error
    }
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

export {ErcConnectServiceApi}
