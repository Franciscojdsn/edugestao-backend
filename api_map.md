# 🔌 Mapa de APIs e Endpoints

## 🔑 Autenticação (`authController`)
- `POST /auth/login` -> Recebe: `{email, senha}`, Retorna: `{ token, user: { role, escolaId } }`
- `GET /auth/me` -> Valida Token.

## 📝 Pipeline de Matrícula (`matriculaController` & `contratoController`)
- `POST /matriculas` -> Cria Rascunho. Retorna `matriculaId`.
- `POST /matriculas/:id/responsaveis` -> Define família.
- `POST /matriculas/:id/finalizar` -> **O Motor.**
  - Payload: `{ contratoBase, extrasIds: [], itensAvulsos: [{id, parcelas}], pagadorId }`
  - Ação: Executa Transaction (Contrato -> Lançamentos -> Boletos).

## 💵 Operações Financeiras (`pagamentoController`)
- `GET /pagamentos` -> Queries: `?status=PENDENTE&dataInicio=YYYY-MM-DD`
- `POST /pagamentos/:id/baixa-manual` -> Efetua pagamento em espécie na escola.
- `POST /webhooks/gateway` -> Rota pública protegida por Header Secret para receber confirmação de PIX/Boleto pago pelo Asaas.

## 📚 Gestão Pedagógica (`frequenciaController` & `notaController`)
- `GET /turmas/:id/diario` -> Traz alunos matriculados para chamada.
- `POST /frequencia/lote` -> Recebe array de presenças/faltas do dia.
- `POST /notas` -> Atualiza ou cria a nota bimestral do aluno na disciplina.

## 📱 Portal de Autoatendimento (`portalController`)
- `GET /portal/aluno/:id/boletim` -> Agrega Notas, Disciplinas e Faltas.
- `GET /portal/aluno/:id/debitos` -> Lista boletos não pagos e gera PIX na hora.