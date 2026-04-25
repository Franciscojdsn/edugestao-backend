"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
// ⭐ CARREGAR .env
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-INSEGURO';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d');
// Validação
if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET não configurado no .env! Usando valor inseguro!');
}
function generateToken(payload) {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
}
function verifyToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        throw new Error('Token inválido ou expirado');
    }
}
//# sourceMappingURL=jwt.js.map