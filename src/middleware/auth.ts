import type { NextFunction, Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import type { JwtPayload } from "jsonwebtoken";
import type { Role } from "../../generated/prisma/enums";
import { jwtUtils } from "../utils/jwt";
import config from "../config";
import { prisma } from "../lib/prisma";


declare global{
    namespace Express{
        interface Request{
            user?:{
                email:string,
                name:string,
                id: string,
                role:Role
            }
        }
    }
}

export const auth = (...requiredRoles:Role[]) => {
    return catchAsync(async(req:Request, res:Response, next:NextFunction) =>{
        const token = req.cookies.accessToken? req.cookies.accessToken: 
        req.headers.authorization?.startsWith("Bearer") ?
        req.headers.authorization?.split(" ")[1]:
        req.headers.authorization;

        if(!token){
            throw new Error("You are not logged in. Please log in to access this resource")
        }
        const verifiedToken = jwtUtils.verifiedToken(token, config.jwt_access_secret)
        if(!verifiedToken.success){
            throw new Error(verifiedToken.error)
        }
        const {email, name, id, role} =verifiedToken.data as JwtPayload;
        if(requiredRoles.length && !requiredRoles.includes(role)){
            throw new Error("Forbidden. You don't have permission to access this resource")
        }
        const user= await prisma.user.findUnique({
            where:{
                id,
                email,
                name,
                role
            }
        });
        if(!user){
            throw new Error("user not found. please log in again")
        };
        if(user.activeStatus === "BLOCKED"){
            throw new Error("Your account has been block. please contact support")
        };
        req.user = {
            email,
            name,
            id,
            role
        };
        next();
    })
};