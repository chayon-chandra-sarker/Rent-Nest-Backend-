import { Router, type IRouter } from "express";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";
import { propertyControllers } from "./property.controller";

const router: IRouter = Router();

router.get(
  "/all-properties",
  propertyControllers.getAllProperties
);

router.get(
  "/my-properties",
  auth(Role.LANDLORD),
  propertyControllers.getMyProperties
);

router.get(
  "/single/:id",
  propertyControllers.getSingleProperty
);

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

router.get(
  "/admin/properties",
  auth(Role.ADMIN),
  propertyControllers.getAllPropertiesForAdmin
);

export const PropertyRoutes: IRouter = router;