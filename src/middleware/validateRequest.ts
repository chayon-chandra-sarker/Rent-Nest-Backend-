import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";


const validateRequest = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    schema.parse({
      body: req.body,
    });

    next();
  };
};

export default validateRequest;