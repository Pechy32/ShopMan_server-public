import { Router } from "express";
import { shoppingListCreateSchema } from "../model/validation/shoppingListValidation.js";
import { itemCreateSchema, itemUpdateSchema } from "../model/validation/itemValidation.js";
import * as listService from "../service/listService.js";
import { authorize } from "../middleware/authorize.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

// ===== Controller functions =====
async function create(req, res) {
    try {
        const { error, value } = shoppingListCreateSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.message });

        const list = await listService.createShoppingList(
            value.name,
            req.session.user.id
        );

        res.status(201).json(list);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

async function getAll(req, res) {
    try {
        const user = req.session.user;
        const lists = await listService.getLists(user.id, user.role);
        res.json(lists);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getOne(req, res) {
    try {
        const user = req.session.user;

        const list = await listService.getList(
            req.params.id,
            user.id,
            user.role
        );

        if (!list) {
            return res.status(404).json({ error: "List not found" });
        }

        // dtoOut
        const dtoOut = list.toObject();
        delete dtoOut.owner?.passwordHash;
        dtoOut.members?.forEach(member => delete member.passwordHash);

        res.json(dtoOut);
    } catch (err) {
        res.status(403).json({ error: err.message });
    }
}


async function remove(req, res) {
    try {
        const user = req.session.user;
        await listService.deleteList(req.params.id, user.id, user.role);
        res.json({ message: "List deleted" });
    } catch (err) {
        res.status(403).json({ error: err.message });
    }
}

async function addMember(req, res) {
    try {
        const { userId } = req.body;
        const user = req.session.user;

        const updated = await listService.addMember(
            req.params.id,
            userId,
            user.id,
            user.role
        );

        // dtoOut
        const dtoOut = {
            _id: updated._id,
            members: updated.members.map(member =>
                member._id ? member._id.toString() : member.toString()
            )
        };

        res.json(dtoOut);
    } catch (err) {
        res.status(403).json({ error: err.message });
    }
}

async function createItem(req, res) {
    try {
        // dtoIn valdiation
        const { error, value } = itemCreateSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.message });
        }

        const user = req.session.user;
        const listId = req.params.id;

        // Service call
        const item = await listService.createItemForList(
            listId,
            value,
            user.id,
            user.role
        );

        // dtoOut
        const dtoOut = {
            _id: item._id,
            name: item.name,
            addedBy: item.addedBy.toString()
        };

        res.status(201).json(dtoOut);
    } catch (err) {
        res.status(403).json({ error: err.message });
    }
}


async function removeMember(req, res) {
    try {
        const { id, memberId } = req.params;
        const user = req.session.user;

        const updated = await listService.removeMember(
            id,
            memberId,
            user.id,
            user.role
        );

        // dtoOut
        const dtoOut = {
            _id: updated._id,
            members: updated.members.map(m =>
                m._id ? m._id.toString() : m.toString()
            )
        };

        res.json(dtoOut);
    } catch (err) {
        res.status(403).json({ error: err.message });
    }
}

async function updateList(req, res) {
    try {
        const { id } = req.params;
        const user = req.session.user;
        const { name, isArchived } = req.body;

        const updated = await listService.updateList(
            id,
            { name, isArchived },
            user.id,
            user.role
        );

        // dtoOut
        const dtoOut = {
            _id: updated._id,
            name: updated.name,
            isArchived: updated.isArchived,
            updatedAt: updated.updatedAt
        };

        res.json(dtoOut);
    } catch (err) {
        res.status(403).json({ error: err.message });
    }
}

async function deleteItem(req, res) {
    try {
        const { id, itemId } = req.params;
        const user = req.session.user;

        const updated = await listService.deleteItemFromList(
            id,
            itemId,
            user.id,
            user.role
        );

        // dtoOut
        const dtoOut = {
            listId: updated._id,
            items: updated.items.map(item =>
                item._id ? item._id.toString() : item.toString()
            )
        };

        res.json(dtoOut);
    } catch (err) {
        res.status(403).json({ error: err.message });
    }
}

async function updateItem(req, res) {
    try {
        const { id: listId, itemId } = req.params;
        const user = req.session.user;

        // dtoIn validation
        const { error, value } = itemUpdateSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.message });

        // service call
        const updatedItem = await listService.updateItemInList(
            listId,
            itemId,
            value,
            user.id,
            user.role
        );

        // dtoOut
        const dtoOut = {
            _id: updatedItem._id,
            name: updatedItem.name,
            addedBy: updatedItem.addedBy.toString(),
            solvedBy: updatedItem.solvedBy ? updatedItem.solvedBy.toString() : null
        };

        res.json(dtoOut);
    } catch (err) {
        res.status(403).json({ error: err.message });
    }
}

// ===== Routes =====
router.post("/", requireAuth, authorize("StandartUsers"), create);
router.get("/", requireAuth, authorize("StandartUsers"), getAll);
router.get("/:id", requireAuth, authorize("StandartUsers"), getOne);
router.delete("/:id", requireAuth, authorize("StandartUsers"), remove);
router.post("/:id/members", requireAuth, authorize("StandartUsers"), addMember);
router.post("/:id/items", requireAuth, authorize("StandartUsers"), createItem);
router.delete("/:id/members/:memberId", requireAuth, authorize("StandartUsers"), removeMember);
router.put("/:id", requireAuth, authorize("StandartUsers"), updateList);
router.delete("/:id/items/:itemId", requireAuth, authorize("StandartUsers"), deleteItem);
router.put("/:id/items/:itemId", requireAuth, authorize("StandartUsers"), updateItem);


export default router;
