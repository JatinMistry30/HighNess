import { Router } from "express";
import { getMe, login, register } from "./authFunction.js";
import { authenticateToken } from "../middleware/client_freelancer_auth.js";

const authRoutes = Router();

authRoutes.post('/login', login);
authRoutes.post('/register', register);
authRoutes.get('/getme', authenticateToken,getMe)

export default authRoutes;
