"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgController = void 0;
const org_service_1 = require("../services/org.service");
class OrgController {
    constructor(app) {
        this.getOrg = async (_req, reply) => {
            const card = await this.service.getOrgCard();
            if (!card) {
                return reply.code(404).send({
                    message: "Организация не настроена",
                });
            }
            return reply.send(card);
        };
        this.service = new org_service_1.OrgService(app);
    }
}
exports.OrgController = OrgController;
