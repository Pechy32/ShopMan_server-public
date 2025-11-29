import { Router } from "express";
import { userCreateSchema, userLoginSchema } from "../model/validation/userValidation.js";
import { registerUser, loginUser, getAllUsers, getUserById, deleteUserById } from "../service/userService.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { authorize } from "../middleware/authorize.js";

const router = Router();

// ===== Controller functions =====
async function register(req, res) {
    try {
        const { error, value } = userCreateSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.message });

        const user = await registerUser(value);

        // Remove hash from response
        const dtoOut = user.toObject();
        delete dtoOut.passwordHash;

        res.status(201).json({ message: "User registered", dtoOut });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

async function login(req, res) {
    try {
        const { error, value } = userLoginSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.message });

        const user = await loginUser(value.email, value.password);

        // Save to session
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role || "StandartUsers"
        };

        // dtoOut
        const dtoOut = user.toObject();
        delete dtoOut.passwordHash;

        res.json({ message: "Logged in", dtoOut });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}


async function me(req, res) {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        //dtoOut
        const dtoOut = { ...req.session.user };

        res.json({ dtoOut });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function logout(req, res) {
    req.session.destroy(() => {
        res.json({ message: "Logged out" });
    });
}

async function getAll(req, res) {
    try {
        const users = await getAllUsers();

        // dtoOut
        const dtoOut = users.map(u => ({
            _id: u._id,
            name: u.name,
            email: u.email,
            createdAt: u.createdAt
        }));

        res.json(dtoOut);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getUserDetail(req, res) {
    try {
        const { id } = req.params;
        const user = await getUserById(id);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // dtoOut
        const dtoOut = {
            _id: user._id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt
        };

        res.json(dtoOut);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

async function deleteUser(req, res) {
    try {
        const { id } = req.params;
        const deleted = await deleteUserById(id);

        if (!deleted) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "User deleted successfully", _id: id });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}


// ===== Routes =====
router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, authorize("StandartUsers"), me);
router.post("/logout", requireAuth, authorize("StandartUsers"), logout);
router.get("/", requireAuth, authorize("Executives"), getAll);
router.get("/:id", requireAuth, authorize("Executives"), getUserDetail);
router.delete("/:id", requireAuth, authorize("Authorities"), deleteUser);

export default router;
