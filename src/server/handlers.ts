import {Request, Response, NextFunction} from 'express';

const handlers = {
  _auth: (req: Request, res: Response, next: NextFunction) => {
    if (req?.query?.token !== process.env.TOKEN) {
      res.status(401).json({message: 'Invalid token'});
      return;
    }

    next();
  },

  baf: {
    products: (req: Request, res: Response) => {
      res.status(200).json({status: 'OK'});
    },
  },

  content: {
    products: (req: Request, res: Response) => {
      res.status(200).json({status: 'OK'});
    },
  },
};

export {handlers};
