import { z } from 'zod'

export const getPortalDadosSchema = z.object({
    // Como o ID vem do Token (req.user), não precisamos de corpo ou query obrigatória aqui,
    // mas deixamos o objeto para seguir o padrão do middleware validate()
    query: z.object({}).optional()
})