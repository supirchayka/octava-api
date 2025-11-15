"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomToken = generateRandomToken;
exports.hashToken = hashToken;
// src/utils/crypto.ts
const node_crypto_1 = require("node:crypto");
function generateRandomToken(bytes = 32) {
    return (0, node_crypto_1.randomBytes)(bytes).toString('hex');
}
function hashToken(token) {
    return (0, node_crypto_1.createHash)('sha256').update(token).digest('hex');
}
