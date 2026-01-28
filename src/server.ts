import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { errorHandler } from './middlewares/errorHandler'
import { authRoutes } from './routes/authRoutes'
import { escolaRoutes } from './routes/escolaRoutes'
import { alunoRoutes } from './routes/alunoRoutes'        
import { turmaRoutes } from './routes/turmaRoutes'         
import { funcionarioRoutes } from './routes/funcionarioRoutes'
import { disciplinaRoutes } from './routes/disciplinaRoutes' 
import { responsavelRoutes } from './routes/responsavelRoutes'
import { turmaDisciplinaRoutes } from './routes/turmaDisciplinaRoutes'
import { notaRoutes } from './routes/notaRoutes'
import { dashboardRoutes } from './routes/dashboardRoutes'
import { contratoRoutes } from './routes/contratoRoutes'
import { pagamentoRoutes } from './routes/pagamentoRoutes'
import { atividadeExtraRoutes } from './routes/atividadeExtraRoutes'
import { enderecoRoutes } from './routes/enderecoRoutes'

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

// Rotas
app.use('/auth', authRoutes)
app.use('/escolas', escolaRoutes)
app.use('/alunos', alunoRoutes)                 
app.use('/turmas', turmaRoutes)                 
app.use('/funcionarios', funcionarioRoutes)
app.use('/disciplinas', disciplinaRoutes) 
app.use(responsavelRoutes)   
app.use(turmaDisciplinaRoutes) 
app.use('/notas', notaRoutes)
app.use('/dashboard', dashboardRoutes)
app.use('/contratos', contratoRoutes)
app.use('/pagamentos', pagamentoRoutes)
app.use('/atividades-extra', atividadeExtraRoutes)
app.use('/enderecos', enderecoRoutes)

// Middleware de erro
app.use(errorHandler)

const PORT = process.env.PORT || 3333
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})