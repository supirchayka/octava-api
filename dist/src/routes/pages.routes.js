"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = pagesRoutes;
const pages_controller_1 = require("../controllers/pages.controller");
async function pagesRoutes(app) {
    const controller = new pages_controller_1.PagesController(app);
    // Главная
    app.get('/pages/home', controller.home);
    // О нас
    app.get('/pages/about', controller.about);
    // Контакты
    app.get('/pages/contacts', controller.contacts);
    // Сведения о мед. организации
    app.get('/pages/org-info', controller.orgInfo);
    // Политика обработки ПДн
    app.get('/pages/personal-data-policy', controller.personalDataPolicy);
    // Политика конфиденциальности
    app.get('/pages/privacy-policy', controller.privacyPolicy);
}
