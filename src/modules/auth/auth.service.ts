import config from "../../config";
import { prisma } from "../../lib/prisma";
import { jwtUtils } from "../../utils/jwt";
import type { ILoginUser } from "./auth.interface";
import bcrypt from "bcrypt";
import type { JwtPayload } from "jsonwebtoken";



const loginUser = async (payload: ILoginUser) => {
  const { email, password } = payload;

  const user = await prisma.user.findFirstOrThrow({
    where: { email },
  });

  // if (user.activeStatus === "BLOCKED") {
  //   throw new Error(
  //     "Your account has been blocked. Please contact support"
  //   );
  // }

  const isPasswordMatched = await bcrypt.compare(
    password,
    user.password
  );

  if (!isPasswordMatched) {
    throw new Error("password is incorrect");
  }

  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in
  );

  return {
    accessToken,
    refreshToken,
  };
};



const refreshToken = async (token: string) => {

  const verifiedToken = jwtUtils.verifiedToken(
    token,
    config.jwt_refresh_secret
  );


  const jwtPayload = verifiedToken as JwtPayload & {
    id: string;
    name: string;
    email: string;
    role: string;
  };

  const accessToken = jwtUtils.createToken(
    {
      id: jwtPayload.id,
      name: jwtPayload.name,
      email: jwtPayload.email,
      role: jwtPayload.role,
    },
    config.jwt_access_secret,
    config.jwt_access_expires_in
  );

  return {
    accessToken,
  };
};



export const authService = {
  loginUser,
  refreshToken,
};