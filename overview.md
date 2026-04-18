# 📄 OVERVIEW - Projeto EduGestão

## 🎯 1. Visão Geral e Propósito
O **EduGestão** é um ERP Educacional de alta performance, baseado em arquitetura **Multi-tenant**. O sistema resolve a fragmentação de processos escolares, unificando a jornada do aluno desde a prospecção até a liquidação financeira e histórico pedagógico, com foco implacável em automação e segurança de dados.

## 🛠️ 2. Stack Tecnológica Base
- **Backend:** Node.js + Express + TypeScript (Tipagem forte e interfaces estritas).
- **Banco de Dados:** PostgreSQL orquestrado via **Prisma ORM v7**.
- **Segurança:** JWT (Access/Refresh Tokens), Bcrypt (Hashing) e RBAC (Role-Based Access Control).
- **Frontend:** React.js (SPA) com React Router Dom v6, Context API (Estado Global) e Axios (Interceptors).

## ⚖️ 3. Regras de Ouro (Inquebráveis)
- **Multi-tenancy Absoluto:** O `escolaId` deve estar presente em 100% das queries. Nenhuma transação pode cruzar os limites do Tenant. sempre em string
- **Identificadores Seguros:** Uso exclusivo de UUIDs (v4) no banco e nas URLs. Zero IDs incrementais. sempre me string
- **Imutabilidade Financeira:** Boletos gerados não são sobrescritos; alterações exigem lançamentos de estorno, desconto ou geração de novos títulos para manter a trilha de auditoria.
- **Soft Delete:** Dados sensíveis (como Alunos e Contratos) nunca recebem `DELETE` real, apenas alteração de status (ex: `SUSPENSO`).

## 🔄 4. O "Core Business": Motor de Matrícula
A matrícula é um **Wizard de 5 Etapas** que previne perda de dados e consolida o faturamento:
1. **Dados Iniciais:** Registro do Aluno e Turma (Gera ID de rascunho).
2. **Núcleo Familiar:** Vínculo de responsável.
3. **Composição Financeira:** Contrato Base + Extras Recorrentes + Itens Avulsos (Fardas/Livros).