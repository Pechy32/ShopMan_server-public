import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import dotenv from "dotenv";

import userRoutes from "./controller/userController.js";
import listRoutes from "./controller/listController.js";

dotenv.config();

const app = express();
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || "superSecret",
    resave: false,
    saveUninitialized: false
}));

mongoose.connect("mongodb://localhost:27017/shopping_list_app")
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error(err));

app.use("/api/users", userRoutes);
app.use("/api/lists", listRoutes);

app.get("/", (req, res) => res.json({ status: "Shopping List API running" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("Server running on port", PORT));
