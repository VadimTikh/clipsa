import {MongoClient} from "mongodb";
import {UnifiedProduct} from '../../interfaces'

const dbNames = {
  clipsa: 'Clipsa',
  clipsa_test: 'ClipsaTest',
  salesdrive: 'salesdrive'
}

const getCollections = (dbName: string) => ({

  products: {

    unified: (client: MongoClient) => (
      client
        .db(dbName)
        .collection<UnifiedProduct>
        ('products_unified')
    )
  }

})

const collections = process.env.NODE_ENV === 'production' ?
  getCollections(dbNames.clipsa) :
  getCollections(dbNames.clipsa_test);

export {collections};
