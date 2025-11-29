import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rolesPath = path.join(__dirname, "../config/roles.json");

const rolesConfig = JSON.parse(fs.readFileSync(rolesPath, "utf-8"));

export function authorize(requiredRole) {
    return (req, res, next) => {
        try {
            const user = req.session.user || req.user;
            if (!user) {
                return res.status(401).json({ error: "Not authenticated" });
            }

            const userRole = user.role || "StandartUsers";
            const roleConfig = rolesConfig[userRole];

            if (!roleConfig) {
                return res.status(403).json({ error: "Unknown role" });
            }

            if (roleConfig.canAccess.includes("*")) {
                return next();
            }

            let currentAccess = `${req.method}:${req.originalUrl.split("?")[0]}`;
            currentAccess = currentAccess.replace(/\/$/, ""); 

            const allowed = roleConfig.canAccess.some(pattern => {
                const regexPattern = "^" + pattern.replace(/\/$/, "").replace("*", ".*") + "$";
                const regex = new RegExp(regexPattern, "i");
                return regex.test(currentAccess);
            });

            if (!allowed) {
                console.warn(`Access denied for ${userRole}: ${currentAccess}`);
                return res.status(403).json({ error: "Access denied" });
            }

            next();
        } catch (err) {
            console.error("Authorization error:", err);
            res.status(500).json({ error: "Authorization check failed" });
        }
    };
}
