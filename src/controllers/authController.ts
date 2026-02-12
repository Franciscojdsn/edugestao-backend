import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { prisma } from '../config/prisma'
import { generateToken } from '../utils/jwt'
import { AppError } from '../middlewares/errorHandler'

export const authController = {
  async login(req: Request, res: Response) {
    console.log("-----------------------------------------");
    console.log("🚀 [DEBUG] Requisição recebida no Controller");
    console.log("📧 Email:", req.body.email);

    try {
      // 1. Tentar buscar no Banco
      console.log("🔍 [DEBUG] Buscando usuário no Prisma...");
      const usuario = await prisma.usuario.findUnique({
        where: { email: req.body.email },
      });

      if (!usuario) {
        console.log("❌ [DEBUG] Usuário não encontrado no banco.");
        throw new AppError('Email ou senha incorretos', 401);
      }

      console.log("✅ [DEBUG] Usuário encontrado. Hash no banco:", usuario.senha);

      // 2. Testar Bcrypt
      console.log("🔐 [DEBUG] Comparando senhas com Bcrypt...");
      const senhaValida = await bcrypt.compare(req.body.senha, usuario.senha);

      console.log("📊 [DEBUG] Resultado Bcrypt:", senhaValida);

      if (!senhaValida) {
        console.log("❌ [DEBUG] Senha incorreta.");
        throw new AppError('Email ou senha incorretos', 401);
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
      console.log("🚨 [DEBUG] Erro capturado no Catch:", error);
      throw error;
    }
  }
}