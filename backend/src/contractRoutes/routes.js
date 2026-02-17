import express from "express";
import {
  createContract,
  submitContract,
  getContract,
  getMyContracts,
  getProposalById,
  getProposalContractStatus,
} from './contractFunctions.js'
import { authenticateToken } from "../middleware/client_freelancer_auth.js";
import { requireClient, requireFreelancer } from "../middleware/freelancerAuthMiddleware.js";
import { acceptContract, downloadContractPDF, rejectContract } from "./contractController.js";
const contractRoutes = express.Router();

// Create contract (FREELANCER ONLY)
contractRoutes.post("/createcontract", authenticateToken, requireFreelancer, createContract);

// Submit contract for review (FREELANCER ONLY)
contractRoutes.post("/:contractId/submit", authenticateToken, requireFreelancer, submitContract);

// Get single contract (BOTH can view)
contractRoutes.get("/:contractId", authenticateToken, getContract);

// Get my contracts (BOTH can view their own)
contractRoutes.get("/my/all", authenticateToken, getMyContracts);

// Route for both Freelancer and Client
contractRoutes.get('/proposals/:proposalId', authenticateToken, getProposalById)

// Contract Download as PDF
contractRoutes.get('/:contractId/pdf' , authenticateToken , downloadContractPDF)


// Contract Status according to the proposal
contractRoutes.get('/proposals/:proposalId/contract-status' ,authenticateToken  , requireFreelancer , getProposalContractStatus)

//Accept and reject routes
contractRoutes.post('/:contractId/accept',authenticateToken , requireClient , acceptContract)
contractRoutes.post('/:contractId/reject' , authenticateToken , requireClient , rejectContract)
export default contractRoutes;
