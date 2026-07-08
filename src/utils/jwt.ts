import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";

const createToken = (
  payload: JwtPayload,
  secret: string,
  expiresIn: NonNullable<SignOptions["expiresIn"]>
) => {
  return jwt.sign(payload, secret, {
    expiresIn,
  });
};

const verifiedToken = (token: string, secret: string) => {
  return jwt.verify(token, secret);
};

export const jwtUtils = {
  createToken,
  verifiedToken,
};