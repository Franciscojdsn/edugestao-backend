"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
exports.validateBody = validateBody;
/**
 * Middleware para validar dados com Zod
 */
function validate(schema) {
    return async (req, res, next) => {
        try {
            console.log("DEBUG: Validando dados do corpo:", req.body); // ADICIONE ISSO
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        }
        catch (error) {
            console.log("DEBUG: Erro de validação Zod!", error); // ADICIONE ISSO
            next(error);
        }
    };
}
/**
 * Middleware simplificado para validar só o body
 */
function validateBody(schema) {
    return async (req, res, next) => {
        try {
            req.body = await schema.parseAsync(req.body);
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
//# sourceMappingURL=validate.js.map