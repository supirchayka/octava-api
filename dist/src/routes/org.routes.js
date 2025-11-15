"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = orgRoutes;
const org_controller_1 = require("../controllers/org.controller");
async function orgRoutes(app) {
    const controller = new org_controller_1.OrgController(app);
    // Публичный метод /org — карточка предприятия
    app.get('/org', controller.getOrg);
}
