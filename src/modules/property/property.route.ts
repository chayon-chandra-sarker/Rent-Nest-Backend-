import { Router } from "express";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";
import { propertyControllers } from "./property.controller";

const router = Router();


router.get("/all-properties", propertyControllers.getAllProperties);
router.get("/single/:id", propertyControllers.getSingleProperty);


router.post(
  "/create",
  auth(Role.LANDLORD),
  propertyControllers.createProperty
);

router.put(
  "/update/:id",
  auth(Role.LANDLORD),
  propertyControllers.updateProperty
);

router.delete(
  "/delete/:id",
  auth(Role.LANDLORD),
  propertyControllers.deleteProperty
);

export const PropertyRoutes = router;