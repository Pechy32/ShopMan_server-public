import Joi from "joi";

export const shoppingListCreateSchema = Joi.object({
    name: Joi.string().min(1).required()
});
