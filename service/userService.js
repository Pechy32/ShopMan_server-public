import bcrypt from "bcrypt";
import { createUser, getUserByEmail, findAllUsers, findUserById, deleteUser } from "../dao/userDao.js";

export async function registerUser(data) {
    const { name, email, password } = data;

    const existing = await getUserByEmail(email);
    if (existing) {
        throw new Error("User already exists with this email");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    return await createUser({
        name,
        email,
        passwordHash
    });
}

export async function loginUser(email, password) {
    const user = await getUserByEmail(email);
    if (!user) throw new Error("Invalid email or password");

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new Error("Invalid email or password");

    return user;
}

export async function getCurrentUser(userId) {
    return await getUserById(userId);
}

export async function getAllUsers() {
    return await findAllUsers();
}

export async function getUserById(userId) {
    return await findUserById(userId);
}

export async function deleteUserById(userId) {
    const user = await findUserById(userId);
    if (!user) return null;

    return deleteUser(userId);
}
