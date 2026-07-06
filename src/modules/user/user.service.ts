
import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma";
import config from "../../config";
import type { registerUserPayload } from "./user.interface";

const registerUserIntoDB = async (payload: registerUserPayload) => {

    const {name, email, password}= payload;
    const isUserExist = await prisma.user.findUnique({
      where: {email}
    })
    if(isUserExist) {
      throw new Error("user with this email already exist")
    }
  const hashedPassword = await bcrypt.hash(password, Number(config.bcrypt_salt_rounds))

    const createdUser = await prisma.user.create({
      data:{
        name,
        email,
        password:hashedPassword,
        // profile:{
        //   create:{
        //     profilePhoto
        //   }
        // }
      }
    });
   

   const user = await prisma.user.findUnique({
    where:{
      id: createdUser.id,
      email: createdUser.email || email
    },
    omit:{
      password:true
    },
    // include:{
    //   profile: true
    // }
   });
   return user;
};

const getMyProfileIntoDB = async (userId:string) =>{
  const user= await prisma.user.findUniqueOrThrow({
    where:{id:userId},
    omit:{
      password:true
    },
    // include:{
    //   profile:true
    // }
  })
  return user;
};

export const userService = {
    registerUserIntoDB,
    getMyProfileIntoDB,
}