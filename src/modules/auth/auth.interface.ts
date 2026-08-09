import type { Request } from "express";
import { Role } from "../../../generated/prisma/enums";


export interface ILoginUser {
  email: string;
  password: string;
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}