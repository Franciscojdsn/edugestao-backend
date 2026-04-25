"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../config/prisma");
const jwt_1 = require("../utils/jwt");
exports.authController = {
    async login(req, res) {
        console.log("-----------------------------------------");
        console.log("🚀 [DEBUG] Requisição recebida no Controller");
        console.log("📧 Email:", req.body.email);
        const { email, senha } = req.body;
        console.log("--- DEBUG LOGIN EDUGESTÃO ---");
        console.log(`[FRONT] E-mail recebido: "${email}" (Tamanho: ${email?.length})`);
        console.log(`[FRONT] Senha recebida: "${senha}" (Tamanho: ${senha?.length})`);
        try {
            const usuario = await prisma_1.prisma.usuario.findUnique({
                where: { email: email.trim().toLowerCase() },
            });
            if (!usuario) {
                console.log("❌ Resultado: Usuário não encontrado no Banco.");
                return res.status(401).json({ message: 'E-mail ou senha incorretos' });
            }
            console.log(`[BANCO] Hash encontrado: ${usuario.senha.substring(0, 15)}...`);
            // COMPARAÇÃO COM LOG
            const senhaValida = await bcryptjs_1.default.compare(senha.trim(), usuario.senha);
            console.log(`[BCRYPT] A senha bate? ${senhaValida ? "SIM ✅" : "NÃO ❌"}`);
            if (!senhaValida) {
                return res.status(401).json({ message: 'E-mail ou senha incorretos' });
            }
            // 3. Gerar Token
            const token = (0, jwt_1.generateToken)({
                userId: usuario.id,
                escolaId: usuario.escolaId,
                role: usuario.role,
            });
            console.log("🎉 [DEBUG] Login realizado com sucesso para:", usuario.email);
            console.log("-----------------------------------------");
            return res.json({
                user: {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    role: usuario.role
                },
                token,
            });
        }
        catch (error) {
            console.error("🔥 ERRO CRÍTICO NO LOGIN:", error);
            res.status(500).json({ error: "Erro interno" });
        }
    }
};
//# sourceMappingURL=authController.js.map