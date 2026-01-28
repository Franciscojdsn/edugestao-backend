import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { withEscolaId, withTenancy } from '../utils/prismaHelpers'

export const relatorioController = {
    async financeiro(req: Request, res: Response) {
        const { mes, ano } = req.query
        const escolaId = req.user?.escolaId

        let whereData: any = {}
        if (mes && ano) {
            const dataInicio = new Date(Number(ano), Number(mes) - 1, 1)
            const dataFim = new Date(Number(ano), Number(mes), 0, 23, 59, 59)
            whereData = {
                dataVencimento: { gte: dataInicio, lte: dataFim },
            }
        }

        const pagamentos = await prisma.pagamento.findMany({
            where: {
                ...whereData,
                contrato: { aluno: { escolaId, deletedAt: null } },
            },
            select: {
                status: true,
                valorTotal: true,
                valorPago: true,
            },
        })

        const resumo = pagamentos.reduce(
            (acc, pag) => {
                acc.total++
                acc.valorTotal += Number(pag.valorTotal)

                if (pag.status === 'PAGO') {
                    acc.pagos++
                    acc.valorRecebido += Number(pag.valorPago || 0)
                } else if (pag.status === 'PENDENTE') {
                    acc.pendentes++
                } else if (pag.status === 'VENCIDO') {
                    acc.vencidos++
                    acc.valorVencido += Number(pag.valorTotal)
                }

                return acc
            },
            {
                total: 0,
                pagos: 0,
                pendentes: 0,
                vencidos: 0,
                valorTotal: 0,
                valorRecebido: 0,
                valorVencido: 0,
            }
        )

        return res.json({
            periodo: mes && ano ? `${mes}/${ano}` : 'Todos',
            resumo: {
                ...resumo,
                valorTotal: Number(resumo.valorTotal.toFixed(2)),
                valorRecebido: Number(resumo.valorRecebido.toFixed(2)),
                valorVencido: Number(resumo.valorVencido.toFixed(2)),
                taxaRecebimento: resumo.total > 0 ? Number(((resumo.pagos / resumo.total) * 100).toFixed(2)) : 0,
            },
        })
    },

    async pedagogico(req: Request, res: Response) {
        const { turmaId, ano } = req.query

        let where: any = {}
        if (turmaId) where.turmaId = turmaId
        if (ano) where.ano = Number(ano)

        where.aluno = { escolaId: req.user?.escolaId, deletedAt: null }

        const notas = await prisma.nota.findMany({
            where,
            include: {
                aluno: { select: { id: true, nome: true } },
                disciplina: { select: { nome: true } },
            },
        })

        const resumoPorDisciplina = notas.reduce((acc: any, nota) => {
            const key = nota.disciplinaId
            if (!acc[key]) {
                acc[key] = {
                    disciplina: nota.disciplina.nome,
                    totalNotas: 0,
                    somaNotas: 0,
                    menorNota: 10,
                    maiorNota: 0,
                    aprovados: 0,
                    reprovados: 0,
                }
            }

            acc[key].totalNotas++
            acc[key].somaNotas += nota.valor
            if (nota.valor.lt(acc[key].menorNota)) acc[key].menorNota = nota.valor
            if (nota.valor.gt(acc[key].maiorNota)) acc[key].maiorNota = nota.valor
            if (nota.valor.gte(6)) acc[key].aprovados++

            return acc
        }, {})

        const relatorio = Object.values(resumoPorDisciplina).map((item: any) => ({
            ...item,
            mediaGeral: Number((item.somaNotas / item.totalNotas).toFixed(2)),
            taxaAprovacao: Number(((item.aprovados / item.totalNotas) * 100).toFixed(2)),
        }))

        return res.json({
            ano: ano || 'Todos',
            turma: turmaId || 'Todas',
            totalNotas: notas.length,
            disciplinas: relatorio,
        })
    },

    async frequencia(req: Request, res: Response) {
        const turmas = await prisma.turma.findMany({
            where: withEscolaId({}),
            select: {
                id: true,
                nome: true,
                turno: true,
                _count: {
                    select: {
                        alunos: true,
                        professores: true,
                        disciplinas: true,
                    },
                },
            },
        })

        const relatorio = turmas.map(t => ({
            turma: {
                id: t.id,
                nome: t.nome,
                turno: t.turno,
            },
            alunos: t._count.alunos,
            professores: t._count.professores,
            disciplinas: t._count.disciplinas,
        }))

        return res.json({
            totalTurmas: turmas.length,
            turmas: relatorio,
        })
    },

    async exportarAlunos(req: Request, res: Response) {
        const alunos = await prisma.aluno.findMany({
            where: withTenancy({}),
            select: {
                nome: true,
                numeroMatricula: true,
                cpf: true,
                dataNascimento: true,
                turno: true,
                turma: { select: { nome: true } },
                responsaveis: {
                    select: {
                        nome: true,
                        tipo: true,
                        email: true,
                    },
                },
                contrato: {
                    select: {
                        valorMensalidade: true,
                        status: true,
                    },
                },
            },
            orderBy: { nome: 'asc' },
        })

        // Formato CSV simples
        const csv = [
            'Nome,Matrícula,CPF,Turma,Série,Turno,Responsável,Telefone,Valor Mensalidade,Status Contrato',
            ...alunos.map(a => {
                const resp = a.responsaveis[0] || {}
                return [
                    a.nome,
                    a.numeroMatricula,
                    a.cpf || '',
                    a.turma?.nome || '',
                    a.turno || '',
                    resp.nome || '',
                    a.contrato?.valorMensalidade || '',
                    a.contrato?.status || '',
                ].join(',')
            }),
        ].join('\n')

        res.header('Content-Type', 'text/csv')
        res.header('Content-Disposition', 'attachment; filename=alunos.csv')
        return res.send(csv)
    },
}