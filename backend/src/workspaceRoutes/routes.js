import express from "express";

import { authenticateToken } from "../middleware/client_freelancer_auth.js";
import { fetchExistingWorkspaces } from "./workspaceFunctions.js";
const workspaceRoutes = express.Router();

workspaceRoutes.get("/",authenticateToken,fetchExistingWorkspaces)

export default workspaceRoutes;
