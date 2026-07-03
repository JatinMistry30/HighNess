import express from "express";
import { saveCanvas, loadCanvas } from "./canvasFunc.js";
import { authenticateToken } from "../middleware/client_freelancer_auth.js";
const canvasRouter = express.Router();

// POST /canvas/save  — save canvas state
canvasRouter.post("/save", authenticateToken, saveCanvas);

// GET /canvas/load/:workspaceId  — load canvas state
canvasRouter.get("/load/:workspaceId", authenticateToken, loadCanvas);

export default canvasRouter;