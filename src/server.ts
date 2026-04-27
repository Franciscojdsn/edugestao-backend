import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { errorHandler } from './middlewares/errorHandler'

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

// Auth 
import { authRoutes } from './routes/authRoutes'

// Core modules
import { escolaRoutes } from './routes/escolaRoutes'
import { alunoRoutes } from './routes/alunoRoutes'
import { turmaRoutes } from './routes/turmaRoutes'
import { funcionarioRoutes } from './routes/funcionarioRoutes'
import { disciplinaRoutes } from './routes/disciplinaRoutes'
import { responsavelRoutes } from './routes/responsavelRoutes'
import { turmaDisciplinaRoutes } from './routes/turmaDisciplinaRoutes'
import { enderecoRoutes } from './routes/enderecoRoutes'

// Pedagógico
import { notaRoutes } from './routes/notaRoutes'
import { frequenciaRoutes } from './routes/frequenciaRoutes'
import { ocorrenciaRoutes } from './routes/ocorrenciaRoutes'
import { gradeHorariaRoutes } from './routes/gradeHorariaRoutes'
import { cronogramaProvaRoutes } from './routes/cronogramaProvaRoutes'

//Financeiro
import { contratoRoutes } from './routes/contratoRoutes'
import { situacaoRoutes } from './routes/situacaoRoutes'
import { gerarBoletosRoutes } from './routes/gerarBoletosRoutes'
import { notificacaoAutomaticaRoutes } from './routes/notificacaoAutomaticaRoutes'
import { lancamentoRoutes } from './routes/lancamentoRoutes'

// Extras
import { atividadeExtraRoutes } from './routes/atividadeExtraRoutes'
import { eventoRoutes } from './routes/eventoRoutes'

// Matricula
import { matriculaRoutes } from './routes/matriculaRoutes'
import { rematriculaRoutes } from './routes/rematriculaRoutes'

//DashBoards e relatorios
import { dashboardRoutes } from './routes/dashboardRoutes'
import { relatorioRoutes } from './routes/relatorioRoutes'
import { historicoEscolarRoutes } from './routes/historicoEscolarRoutes'

// Comunicação
import { comunicadoRoutes } from './routes/comunicadoRoutes'

// Portal do Responsável
import { portalResponsavelRoutes } from './routes/portalResponsavelRoutes'

//Logs de Auditoria
import { logAuditoriaRoutes } from './routes/logAuditoriaRoutes'

dotenv.config()
const app = express()


const allowedOrigins = [
  'https://edugestao-frontend.vercel.app',
  'https://edugestao-frontend-franciscojdsn97-4743s-projects.vercel.app',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean).map(origin => String(origin).replace(/\/$/, '')) as string[];

// 2. Segurança de Cabeçalhos (Proteção contra XSS e Sniffing)
app.use(helmet({
  contentSecurityPolicy: false, // Em desenvolvimento/cross-domain, o CSP estrito pode bloquear o login
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());


app.use(cors({
  origin: function (origin, callback) {
    // Permite requisições sem origin (como mobile apps ou ferramentas de teste)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("Origem bloqueada pelo CORS:", origin); // Ajuda no Debug
      callback(new Error('Bloqueado pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 3. Sanitização Básica (Proteção contra injeção de scripts nos inputs)

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Muitas requisições originadas deste IP, tente novamente mais tarde.'
});
app.use('/auth', limiter); 


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
  })
})

// AUTH
app.use('/auth', authRoutes)

//CORE
app.use('/escolas', escolaRoutes)
app.use('/alunos', alunoRoutes)
app.use('/turmas', turmaRoutes)
app.use('/funcionarios', funcionarioRoutes)
app.use('/disciplinas', disciplinaRoutes)
app.use(responsavelRoutes)
app.use(turmaDisciplinaRoutes)
app.use('/enderecos', enderecoRoutes)

//Pedagógico
app.use('/notas', notaRoutes)
app.use('/frequencias', frequenciaRoutes)
app.use('/ocorrencias', ocorrenciaRoutes)
app.use('/grade', gradeHorariaRoutes)
app.use('/cronogramas', cronogramaProvaRoutes)

// Financeiro
app.use('/contratos', contratoRoutes)
app.use('/pagamentos', situacaoRoutes)
app.use(gerarBoletosRoutes)
app.use('/notificacao-automatica', notificacaoAutomaticaRoutes)
app.use(lancamentoRoutes)

//Extras
app.use('/atividades-extra', atividadeExtraRoutes)
app.use('/eventos', eventoRoutes)

//Matricula
app.use('/matriculas', matriculaRoutes)
app.use('/rematriculas', rematriculaRoutes)

//Dashboards e relatórios
app.use('/dashboard', dashboardRoutes)
app.use('/relatorios', relatorioRoutes)
app.use('/historico-escolar', historicoEscolarRoutes)

// Comunicação
app.use('/comunicados', comunicadoRoutes)

// Portal do Responsável
app.use('/portal-responsavel', portalResponsavelRoutes)

// Logs de Auditoria
app.use('/logs', logAuditoriaRoutes)


// Middleware de erro
app.use(errorHandler)

const PORT = process.env.PORT || 3333
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
