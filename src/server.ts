import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { errorHandler } from './middlewares/errorHandler'
// 1. Importa os roteadores específicos que você criou
import { authRoutes } from './routes/authRoutes'
import { escolaRoutes } from './routes/escolaRoutes'

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

// Exemplo de como as rotas assíncronas funcionam agora no Express 5:
app.get('/teste-erro', async (req, res) => {
  throw new Error("Erro assíncrono capturado nativamente pelo Express 5!")
})

// 2. Registra os roteadores no app principal, adicionando o prefixo '/auth' e '/escola'
// Agora o caminho completo para login será http://localhost:3333/auth/login
app.use('/auth', authRoutes)
// E para escola será http://localhost:3333/escola/...
app.use('/escolas', escolaRoutes) 


// Middleware de erro (SEMPRE por último!)
app.use(errorHandler)

const PORT = process.env.PORT || 3333
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
