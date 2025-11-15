"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = catalogRoutes;
const catalog_controller_1 = require("../controllers/catalog.controller");
async function catalogRoutes(app) {
    const controller = new catalog_controller_1.CatalogController(app);
    // Категории услуг
    app.get("/service-categories", controller.getServiceCategories);
    app.get("/service-categories/:slug", controller.getServiceCategory);
    // Услуга
    app.get("/services/:slug", controller.getService);
    // Аппараты
    app.get("/devices", controller.getDevicesList);
    app.get("/devices/:slug", controller.getDevice);
}
