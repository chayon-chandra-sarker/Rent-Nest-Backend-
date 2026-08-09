import config from "../../config";
import { prisma } from "../../lib/prisma";
import { jwtUtils } from "../../utils/jwt";
import type { ILoginUser } from "./auth.interface";
import bcrypt from "bcrypt";
import type { JwtPayload } from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(
  config.google_client_id
);


const loginUser = async (payload: ILoginUser) => {
  const { email, password } = payload;

  const user = await prisma.user.findFirstOrThrow({
    where: { email },
  });

  const isPasswordMatched = await bcrypt.compare(
    password,
    user.password
  );

  if (!isPasswordMatched) {
    throw new Error("Password is incorrect");
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


const googleLogin = async (idToken: string) => {
  // Verify Google ID Token
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: config.google_client_id,
  });

  const payload = ticket.getPayload();

  if (!payload) {
    throw new Error("Invalid Google token");
  }

  // Google user information
  const googleId = payload.sub;
  const email = payload.email;
  const name = payload.name || "Google User";
  const image = payload.picture;

  if (!googleId) {
    throw new Error("Google ID not found");
  }

  if (!email) {
    throw new Error("Google account email not found");
  }

  let user = await prisma.user.findUnique({
    where: {
      email,
    },
  });


  if (!user) {
    const randomPassword = Math.random()
      .toString(36)
      .slice(-12);

    const hashedPassword = await bcrypt.hash(
      randomPassword,
      10
    );

    user = await prisma.user.create({
      data: {
        email,
        name,
        googleId,
        password: hashedPassword,
        image,
        role: "TENANT",
      },
    });
  }


  else if (!user.googleId) {
    user = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        googleId,
        image: user.image || image,
      },
    });
  }

  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  // Access Token
  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in
  );

  // Refresh Token
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
  googleLogin,
  refreshToken,
};