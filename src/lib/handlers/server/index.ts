import {
  IUpdateClipsaDopNacenkaResBody,
  IUpdateClipsaDopNacenkaReqBody
} from "../../../types";
import {mongoHandler} from "../../mongo";
import {log} from "../../log";

const server = {

  update_clipsa_dop_nacenka: async (
    {sku, dop_nac}: IUpdateClipsaDopNacenkaReqBody
  ): Promise<IUpdateClipsaDopNacenkaResBody> => {

    try {

      const [
        oldDopNacenkaDoc,
        clipsaProductDoc
      ] = await Promise.all([
        mongoHandler
          .by_collections
          .site_clipsa_dop_nac
          .getProductBySku(sku),

        mongoHandler
          .by_collections
          .site_clipsa_products
          .getProductBySku(sku)
      ])

      if (!clipsaProductDoc) {
        log.all(`Не найден товар в коллекции Клипсы, арт ${sku}`)
        throw new Error(`Товара нету в базе Клипсы`)
      }

      const oldDopNacenka = oldDopNacenkaDoc?.value ?? 0

      await mongoHandler.by_collections
        .site_clipsa_dop_nac
        .upsertProductBySku({
          sku,
          value: dop_nac
        })

      const newDopNacenkaDoc = await mongoHandler
        .by_collections
        .site_clipsa_dop_nac
        .getProductBySku(sku)

      /*const [
        _, newDopNacenkaDoc
      ] = await Promise.all([
        mongoHandler.by_collections
          .site_clipsa_dop_nac
          .upsertProductBySku({
            sku,
            value: dop_nac
          }),

        mongoHandler
          .by_collections
          .site_clipsa_dop_nac
          .getProductBySku(sku)
      ]);*/

      if (newDopNacenkaDoc?.value !== dop_nac) {
        log.all(`Не обновилась доп наценка в коллекции доп наценок Клипсы для арт ${sku}, должна быть ${dop_nac}, а имеет значение ${JSON.stringify(newDopNacenkaDoc?.value)}`)
        throw new Error(`Не удалось добавить доп наценку в базу, обратитесь к разработчику`)
      }

      const newPrice = clipsaProductDoc.sell_price > 0 ?
        (clipsaProductDoc.sell_price - oldDopNacenka + dop_nac) : 0

      await Promise.all([
        mongoHandler
          .by_collections
          .site_clipsa_products
          .updateProductDopNacBySku(sku, dop_nac),

        mongoHandler
          .by_collections
          .site_clipsa_products
          .updateProductSellPriceBySku(sku, newPrice)
      ])

      return {
        sku, sell_price: newPrice
      }

    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      log.all(`server.update_clipsa_dop_nacenka, sku: ${sku}, dopNac: ${dop_nac}, error: ${errorMessage}`)

      throw error
    }
  }
}

export {server}
