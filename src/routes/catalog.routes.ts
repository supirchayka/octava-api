// src/routes/catalog.routes.ts
import type { FastifyInstance } from "fastify";
import { CatalogController } from "../controllers/catalog.controller";

export default async function catalogRoutes(app: FastifyInstance) {
  const controller = new CatalogController(app);

  // Категории услуг
  app.get("/service-categories", controller.getServiceCategories);
  app.get("/service-categories/:slug", controller.getServiceCategory);

  // Услуга
  app.get("/services/:slug", controller.getService);

  // Аппараты
  app.get("/devices", controller.getDevicesList);
  app.get("/devices/:slug", controller.getDevice);
}
