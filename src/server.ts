import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { errorHandler } from './middlewares/errorHandler'

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

//Financeiro
import { contratoRoutes } from './routes/contratoRoutes'
import { pagamentoRoutes } from './routes/pagamentoRoutes'
import { gerarPagamentosRoutes } from './routes/gerarPagamentosRoutes'
import { reguaCobracaRoutes } from './routes/reguaCobracaRoutes'

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

app.use(cors())
app.use(express.json())

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

// Financeiro
app.use('/contratos', contratoRoutes)
app.use('/pagamentos', pagamentoRoutes)
app.use(gerarPagamentosRoutes)
app.use('/regua-cobranca', reguaCobracaRoutes)

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
app.use('/logs-auditoria', logAuditoriaRoutes)


// Middleware de erro
app.use(errorHandler)

const PORT = process.env.PORT || 3333
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})