import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || "access_secret";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_SECRET || "refresh_secret";

const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES || "60m";
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES || "7d";

interface TokenPayload {
  id: string;
  role: 'rider' | 'driver' | 'admin';
}


export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(
    payload,
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN } as SignOptions
  );
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(
    payload,
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN } as SignOptions
  );
};

export const verifyAccessToken = (token: string): JwtPayload | string => {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET);
  } catch {
    throw new Error("Invalid or expired access token");
  }
};

export const verifyRefreshToken = (token: string): JwtPayload | string => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET);
  } catch {
    throw new Error("Invalid or expired refresh token");
  }
};
