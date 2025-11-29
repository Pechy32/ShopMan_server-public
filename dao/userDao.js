import User from "../model/User.js";

export async function createUser(data) {
    // data = { name, email, passwordHash }
    return await User.create(data);
}

export async function getUserByEmail(email) {
    return await User.findOne({ email });
}

export async function findUserById(id) {
    return await User.findById(id);
}

export async function deleteUser(id) {
    return await User.findByIdAndDelete(id);
}

export async function findAllUsers(){
    return await User.find();
}
