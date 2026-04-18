```mermaid
sequenceDiagram
    autonumber
    actor Admin as ADMIN / FINANCEIRO
    participant API as Express Router
    participant Zod as Middleware Zod
    participant Prisma as DB Transaction
    
    Admin->>API: POST /contratos/:id/suspender { motivo }
    API->>Zod: Valida UUID e schema
    Zod-->>API: Schema Válido
    API->>Prisma: Inicia $transaction
    
    rect rgb(30, 30, 30)
    Note right of Prisma: Atomic Operation Boundary
    Prisma->>Prisma: UPDATE Contrato (status=SUSPENSO, ativo=false)
    Prisma->>Prisma: UPDATE Boletos (status=CANCELADO) WHERE vencimento > hoje AND status=PENDENTE
    Prisma->>Prisma: CREATE LogAuditoria (snapshot before/after)
    end
    
    Prisma-->>API: Transação Commitada
    API-->>Admin: 200 OK { boletosAfetados: N }