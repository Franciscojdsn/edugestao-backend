# 🧠 Modelo Lógico - EduGestão

## 🏫 Núcleo Escola (Tenant)
- **Escola**
  - Configurações Globais
  - Mensalidade Padrão
  - Dia de Vencimento
  - Logotipo e Identidade

## 👤 Identidade & Acessos
- **Usuário** (Auth)
  - Role (ADMIN, FINANCEIRO, PROFESSOR, etc.)
  - Email/Senha (Bcrypt)
  - Link com Escola
- **Funcionário**
  - Dados Pessoais
  - Cargo/Vínculo

## 📚 Estrutura Pedagógica
- **Turma**
  - Ano Letivo / Turno
  - Capacidade
- **Disciplina**
  - Carga Horária
- **TurmaDisciplina** (O Cérebro)
  - Vínculo Professor + Matéria + Turma
- **GradeHoraria**
  - Horários das Aulas

## 🎓 Ciclo de Vida do Aluno
- **Aluno**
  - Matrícula Única
  - Status (ATIVO, INATIVO, TRANCADO)
- **Responsável**
  - Tipo (PAI, MÃE, TUTOR)
  - **Responsável Financeiro** (Flag Crucial)
- **Registro Acadêmico**
  - Notas (Bimestrais)
  - Frequência (Diária)
  - Ocorrências

## 💰 Motor Financeiro (Foco do Projeto)
- **Contrato** (Regras)
  - Valor Base Mensal
  - Descontos Fixos
  - Dia de Vencimento Específico
- **Atividades Extras**
  - Serviços Recorrentes (Judô, Ballet)
  - Vínculo Aluno-Atividade
- **Lançamentos/Vendas**
  - Itens Únicos (Fardas, Livros)
  - Pode ser parcelado no contrato
- **Pagamentos (Boletos)**
  - Status (PENDENTE, PAGO, ATRASADO)
  - Valor Consolidado (Mensalidade + Extras + Parcelas de Itens)