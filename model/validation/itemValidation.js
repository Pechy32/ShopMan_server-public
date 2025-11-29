import Joi from "joi";

export const itemCreateSchema = Joi.object({
    name: Joi.string().min(1).required()
});

export const itemUpdateSchema = Joi.object({
    name: Joi.string().min(1).optional(),
    solvedBy: Joi.string().optional().allow(null)
});