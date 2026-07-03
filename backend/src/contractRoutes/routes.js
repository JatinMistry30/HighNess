import express from "express";
import {
  createContract,
  submitContract,
  getContract,
  getMyContracts,
  getProposalById,
  getProposalContractStatus,
  getProposalContracts,
} from "./contractFunctions.js";
import { authenticateToken } from "../middleware/client_freelancer_auth.js";
import {
  requireClient,
  requireFreelancer,
} from "../middleware/freelancerAuthMiddleware.js";
import {
  acceptContract,
  downloadContractPDF,
  rejectContract,
} from "./contractController.js";

const contractRoutes = express.Router();

// SPECIFIC static routes FIRST
contractRoutes.post(
  "/createcontract",
  authenticateToken,
  requireFreelancer,
  createContract,
);
contractRoutes.get("/my/all", authenticateToken, getMyContracts);
contractRoutes.get(
  "/proposal/:proposalId",
  authenticateToken,
  getProposalContracts,
);
contractRoutes.get(
  "/proposals/:proposalId/contract-status",
  authenticateToken,
  requireFreelancer,
  getProposalContractStatus,
);
contractRoutes.get(
  "/proposals/:proposalId",
  authenticateToken,
  getProposalById,
);

//DYNAMIC :contractId routes AFTER static ones
contractRoutes.post(
  "/:contractId/submit",
  authenticateToken,
  requireFreelancer,
  submitContract,
);
contractRoutes.post(
  "/:contractId/accept",
  authenticateToken,
  acceptContract,
);
contractRoutes.post(
  "/:contractId/reject",
  authenticateToken,
  requireClient,
  rejectContract,
);
contractRoutes.get("/:contractId/pdf", authenticateToken, downloadContractPDF);
contractRoutes.get("/:contractId", authenticateToken, getContract);

export default contractRoutes;
