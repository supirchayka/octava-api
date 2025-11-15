"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = adminFilesRoutes;
const admin_files_controller_1 = require("../controllers/admin-files.controller");
async function adminFilesRoutes(app) {
    const controller = new admin_files_controller_1.AdminFilesController(app);
    app.post('/admin/files/upload', {
        preHandler: [app.authenticate]
    }, controller.upload);
}
