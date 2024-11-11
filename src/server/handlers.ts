import {Request, Response, NextFunction} from 'express';
import {getConnection, dbName, collections} from '../lib/mongo'

const handlers = {
  _auth: (req: Request, res: Response, next: NextFunction) => {
    if (req?.query?.token !== process.env.TOKEN) {
      res.status(401).json({message: 'Invalid token'});
      return;
    }

    next();
  },

  baf: {
    products: async (req: Request, res: Response) => {

      const mongo = await getConnection()

      const collection = mongo.db(dbName).collection(collections.baf.products)

      const products = await collection.find().toArray()

      res.status(200).json({data: products});
    },
  },

  content: {
    products: (req: Request, res: Response) => {
      res.status(200).json({status: 'OK'});
    },
  },
};

export {handlers};
