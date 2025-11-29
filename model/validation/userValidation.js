import Joi from "joi";

export const userCreateSchema = Joi.object({
    name: Joi.string().min(2).max(80).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
});

export const userLoginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});
