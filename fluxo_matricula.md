# 🚀 Processo de Matrícula (Wizard Steps)

## 1. Entrada de Dados (Rascunho)
- Cadastro civil do Aluno.
- Seleção de Ano Letivo e Turma.
- *Ação:* Sistema cria registro com status `MATRICULA_PENDENTE`.

## 2. Composição Familiar
- Busca ou Cadastro de Responsáveis.
- Definição do grau de parentesco.
- *Ação:* Marcação obrigatória de quem assina o contrato (`isResponsavelFinanceiro`).

## 3. Montagem do Carrinho (Serviços e Itens)
- **Recorrentes:** Definição da mensalidade e adesão a Atividades Extras.
- **Avulsos:** Adição de fardamentos, apostilas ou taxas de material.

## 4. Engenharia Financeira (O Diferencial)
- Sistema calcula o Total Recorrente vs Total Avulso.
- Secretaria define regra de parcelamento do avulso (Ex: Farda de R$300 em 3x de R$100).
- Sistema projeta o fluxo de caixa (Preview das parcelas).

## 5. Efetivação e Automação
- Revisão final com o responsável.
- *Backend Transaction:* Salva Contrato -> Salva Vínculos -> Gera Tabela de Boletos.
- Emissão do Contrato em PDF.
- Mudança do Aluno para Status `ATIVO`.