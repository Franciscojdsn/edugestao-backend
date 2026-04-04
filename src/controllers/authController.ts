import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../config/prisma'
import { generateToken } from '../utils/jwt'
import { AppError } from '../middlewares/errorHandler'

export const authController = {
  async login(req: Request, res: Response) {
    console.log("-----------------------------------------");
    console.log("🚀 [DEBUG] Requisição recebida no Controller");
    console.log("📧 Email:", req.body.email);

    const { email, senha } = req.body;

    console.log("--- DEBUG LOGIN EDUGESTÃO ---");
    console.log(`[FRONT] E-mail recebido: "${email}" (Tamanho: ${email?.length})`);
    console.log(`[FRONT] Senha recebida: "${senha}" (Tamanho: ${senha?.length})`);

    try {
      const usuario = await prisma.usuario.findUnique({
        where: { email: email.trim().toLowerCase() },
      });

      if (!usuario) {
        console.log("❌ Resultado: Usuário não encontrado no Banco.");
        return res.status(401).json({ message: 'E-mail ou senha incorretos' });
      }

      console.log(`[BANCO] Hash encontrado: ${usuario.senha.substring(0, 15)}...`);

      // COMPARAÇÃO COM LOG
      const senhaValida = await bcrypt.compare(senha.trim(), usuario.senha);
      console.log(`[BCRYPT] A senha bate? ${senhaValida ? "SIM ✅" : "NÃO ❌"}`);

      if (!senhaValida) {
        return res.status(401).json({ message: 'E-mail ou senha incorretos' });
      }

      // 3. Gerar Token
      const token = generateToken({
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

    } catch (error) {
      console.error("🔥 ERRO CRÍTICO NO LOGIN:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  }
}