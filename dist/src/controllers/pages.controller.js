"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PagesController = void 0;
const pages_service_1 = require("../services/pages.service");
class PagesController {
    constructor(app) {
        this.home = async (_req, reply) => {
            const data = await this.service.getHome();
            if (!data) {
                return reply.code(404).send({ message: "Главная страница не настроена" });
            }
            return reply.send(data);
        };
        this.about = async (_req, reply) => {
            const data = await this.service.getAbout();
            if (!data) {
                return reply.code(404).send({ message: "Страница «О нас» не настроена" });
            }
            return reply.send(data);
        };
        this.contacts = async (_req, reply) => {
            const data = await this.service.getContacts();
            if (!data) {
                return reply
                    .code(404)
                    .send({ message: "Страница «Контакты» не настроена" });
            }
            return reply.send(data);
        };
        this.orgInfo = async (_req, reply) => {
            const data = await this.service.getOrgInfo();
            if (!data) {
                return reply
                    .code(404)
                    .send({ message: "Страница сведений об организации не настроена" });
            }
            return reply.send(data);
        };
        this.personalDataPolicy = async (_req, reply) => {
            const data = await this.service.getPersonalDataPolicy();
            if (!data) {
                return reply
                    .code(404)
                    .send({ message: "Страница политики обработки ПДн не настроена" });
            }
            return reply.send(data);
        };
        this.privacyPolicy = async (_req, reply) => {
            const data = await this.service.getPrivacyPolicy();
            if (!data) {
                return reply
                    .code(404)
                    .send({ message: "Страница политики конфиденциальности не настроена" });
            }
            return reply.send(data);
        };
        this.service = new pages_service_1.PagesService(app);
    }
}
exports.PagesController = PagesController;
