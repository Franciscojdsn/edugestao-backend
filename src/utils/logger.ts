// src/utils/logger.ts
import axios from 'axios';

enum LogLevel {
  INFO = 'INFO',     // Auditoria comum (quem mudou o quê)
  WARN = 'WARN',     // Inconsistência (ex: tentativa de acesso a recurso inexistente)
  CRITICAL = 'CRITICAL' // VIOLAÇÃO (ex: tentativa de burlar Tenancy)
}

export const logger = {
  async critical(message: string, context: any) {
    console.error(`[CRITICAL] ${message}`, context);
    
    // 1. Enviar para Slack/Discord via Webhook
    if (process.env.SLACK_WEBHOOK_URL) {
      await axios.post(process.env.SLACK_WEBHOOK_URL, {
        text: `🚨 *ALERTA DE SEGURANÇA - EDUGESTÃO* 🚨\n*Mensagem:* ${message}\n*Contexto:* \`\`\`${JSON.stringify(context, null, 2)}\`\`\``
      }).catch((err: any) => console.error("Falha ao enviar alerta para Slack", err));
    }

    // 2. Aqui você integraria com Splunk ou Datadog no futuro
  },

  async audit(data: {
    entidade: string;
    acao: string;
    entidadeId: string;
    escolaId: string;
    usuarioId?: string;
    dadosNovos?: any;
    dadosAntigos?: any;
  }) {
    // Grava no banco de dados para conformidade (LGPD/Auditoria Financeira)
    // Usamos o prismaBase para evitar recursão infinita na extensão
    try {
      // Importação dinâmica para evitar circular dependency
      const { prisma } = require('../lib/prisma'); 
      await prisma.logAuditoria.create({ data });
    } catch (e) {
      console.error("Erro ao gravar log de auditoria", e);
    }
  }
};