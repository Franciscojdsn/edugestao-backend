"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const errorHandler_1 = require("./middlewares/errorHandler");
// Auth 
const authRoutes_1 = require("./routes/authRoutes");
// Core modules
const escolaRoutes_1 = require("./routes/escolaRoutes");
const alunoRoutes_1 = require("./routes/alunoRoutes");
const turmaRoutes_1 = require("./routes/turmaRoutes");
const funcionarioRoutes_1 = require("./routes/funcionarioRoutes");
const disciplinaRoutes_1 = require("./routes/disciplinaRoutes");
const responsavelRoutes_1 = require("./routes/responsavelRoutes");
const turmaDisciplinaRoutes_1 = require("./routes/turmaDisciplinaRoutes");
const enderecoRoutes_1 = require("./routes/enderecoRoutes");
// Pedagógico
const notaRoutes_1 = require("./routes/notaRoutes");
const frequenciaRoutes_1 = require("./routes/frequenciaRoutes");
const ocorrenciaRoutes_1 = require("./routes/ocorrenciaRoutes");
const gradeHorariaRoutes_1 = require("./routes/gradeHorariaRoutes");
const cronogramaProvaRoutes_1 = require("./routes/cronogramaProvaRoutes");
//Financeiro
const contratoRoutes_1 = require("./routes/contratoRoutes");
const situacaoRoutes_1 = require("./routes/situacaoRoutes");
const gerarBoletosRoutes_1 = require("./routes/gerarBoletosRoutes");
const notificacaoAutomaticaRoutes_1 = require("./routes/notificacaoAutomaticaRoutes");
const lancamentoRoutes_1 = require("./routes/lancamentoRoutes");
// Extras
const atividadeExtraRoutes_1 = require("./routes/atividadeExtraRoutes");
const eventoRoutes_1 = require("./routes/eventoRoutes");
// Matricula
const matriculaRoutes_1 = require("./routes/matriculaRoutes");
const rematriculaRoutes_1 = require("./routes/rematriculaRoutes");
//DashBoards e relatorios
const dashboardRoutes_1 = require("./routes/dashboardRoutes");
const relatorioRoutes_1 = require("./routes/relatorioRoutes");
const historicoEscolarRoutes_1 = require("./routes/historicoEscolarRoutes");
// Comunicação
const comunicadoRoutes_1 = require("./routes/comunicadoRoutes");
// Portal do Responsável
const portalResponsavelRoutes_1 = require("./routes/portalResponsavelRoutes");
//Logs de Auditoria
const logAuditoriaRoutes_1 = require("./routes/logAuditoriaRoutes");
dotenv_1.default.config();
const app = (0, express_1.default)();
const allowedOrigins = process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL, 'http://localhost:3000']
    : ['http://localhost:3000'];
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            callback(new Error('Bloqueado pelo CORS'));
        }
    },
    credentials: true
}));
app.use(express_1.default.json());
// Logger de Requisições para Debug
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
// Health check
app.get('/health', (req, res) => {
    return res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});
// AUTH
app.use('/auth', authRoutes_1.authRoutes);
//CORE
app.use('/escolas', escolaRoutes_1.escolaRoutes);
app.use('/alunos', alunoRoutes_1.alunoRoutes);
app.use('/turmas', turmaRoutes_1.turmaRoutes);
app.use('/funcionarios', funcionarioRoutes_1.funcionarioRoutes);
app.use('/disciplinas', disciplinaRoutes_1.disciplinaRoutes);
app.use(responsavelRoutes_1.responsavelRoutes);
app.use(turmaDisciplinaRoutes_1.turmaDisciplinaRoutes);
app.use('/enderecos', enderecoRoutes_1.enderecoRoutes);
//Pedagógico
app.use('/notas', notaRoutes_1.notaRoutes);
app.use('/frequencias', frequenciaRoutes_1.frequenciaRoutes);
app.use('/ocorrencias', ocorrenciaRoutes_1.ocorrenciaRoutes);
app.use('/grade', gradeHorariaRoutes_1.gradeHorariaRoutes);
app.use('/cronogramas', cronogramaProvaRoutes_1.cronogramaProvaRoutes);
// Financeiro
app.use('/contratos', contratoRoutes_1.contratoRoutes);
app.use('/pagamentos', situacaoRoutes_1.situacaoRoutes);
app.use(gerarBoletosRoutes_1.gerarBoletosRoutes);
app.use('/notificacao-automatica', notificacaoAutomaticaRoutes_1.notificacaoAutomaticaRoutes);
app.use(lancamentoRoutes_1.lancamentoRoutes);
//Extras
app.use('/atividades-extra', atividadeExtraRoutes_1.atividadeExtraRoutes);
app.use('/eventos', eventoRoutes_1.eventoRoutes);
//Matricula
app.use('/matriculas', matriculaRoutes_1.matriculaRoutes);
app.use('/rematriculas', rematriculaRoutes_1.rematriculaRoutes);
//Dashboards e relatórios
app.use('/dashboard', dashboardRoutes_1.dashboardRoutes);
app.use('/relatorios', relatorioRoutes_1.relatorioRoutes);
app.use('/historico-escolar', historicoEscolarRoutes_1.historicoEscolarRoutes);
// Comunicação
app.use('/comunicados', comunicadoRoutes_1.comunicadoRoutes);
// Portal do Responsável
app.use('/portal-responsavel', portalResponsavelRoutes_1.portalResponsavelRoutes);
// Logs de Auditoria
app.use('/logs', logAuditoriaRoutes_1.logAuditoriaRoutes);
// Middleware de erro
app.use(errorHandler_1.errorHandler);
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
//# sourceMappingURL=server.js.map