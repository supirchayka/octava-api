"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadController = void 0;
const lead_service_1 = require("../services/lead.service");
class LeadController {
    constructor(app) {
        this.createLead = async (request, reply) => {
            const body = request.body;
            const uaHeader = request.headers["user-agent"];
            const userAgent = Array.isArray(uaHeader)
                ? uaHeader.join(" ")
                : uaHeader ?? null;
            const refHeader = (request.headers["referer"] ??
                request.headers["referrer"]);
            const referer = Array.isArray(refHeader) ? refHeader[0] : refHeader ?? null;
            const result = await this.service.createLead(body, {
                ip: request.ip,
                userAgent,
                referer,
            });
            return reply.code(201).send({
                message: "Заявка успешно отправлена",
                lead: result,
            });
        };
        this.service = new lead_service_1.LeadService(app);
    }
}
exports.LeadController = LeadController;
