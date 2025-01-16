import jwt from 'jsonwebtoken';

const createRequestToken = (user_key: string, secret: string) => {

  return jwt.sign({user_key},
    secret, {
      algorithm: 'HS256',
      expiresIn: 10 * 60 // 10 min
    })
}

export default createRequestToken
