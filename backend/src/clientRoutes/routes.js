import { Router } from "express";
import {
  clientAuth,
  clientOnly,
  verifiedOnly,
} from "../middleware/clientAuthMiddleware.js";
import {
  createJob,
  deleteJob,
  getClientStats,
  updateJob,
  getClientJobs,
  getClientJobById,
  getJobProposals,
  acceptProposal,
  rejectProposal,
  counterProposal,
} from "./clientFunction.js";

const clientRoutes = Router();

// Create a new job
clientRoutes.post("/create", clientAuth, clientOnly, verifiedOnly, createJob);

// Get all jobs for the client (with optional filters)
clientRoutes.get("/jobs", clientAuth, clientOnly, getClientJobs);

// Get a specific job by ID
clientRoutes.get("/jobs/:jobId", clientAuth, clientOnly, getClientJobById);

// Update a job
clientRoutes.put("/jobs/:jobId", clientAuth, clientOnly, updateJob);

// Delete (close) a job
clientRoutes.delete("/jobs/:jobId", clientAuth, clientOnly, deleteJob);

// Get client statistics
clientRoutes.get(
  "/stats",
  clientAuth,
  clientOnly,
  verifiedOnly,
  getClientStats,
);

clientRoutes.get(
  "/jobs/:jobId/proposals",
  clientAuth,
  clientOnly,
  verifiedOnly,
  getJobProposals,
);

clientRoutes.post(
  "/proposals/:proposalId/accept",
  clientAuth,
  clientOnly,
  verifiedOnly,
  acceptProposal,
);

clientRoutes.post(
  "/proposals/:proposalId/reject",
  clientAuth,
  clientOnly,
  verifiedOnly,
  rejectProposal
)

clientRoutes.post(
  "/proposals/:proposalId/counter",
  clientAuth,
  clientOnly,
  verifiedOnly,
  counterProposal
)
export default clientRoutes;
