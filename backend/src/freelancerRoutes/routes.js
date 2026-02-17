import express from "express";
import {
  browseJobs,
  getJobDetails,
  applyToJob,
  getMyApplications,
  saveJob,
  unsaveJob,
  getSavedJobs,
  getDashboardStats,
  submitProposal,
  getMyProposals,
  respondToCounterOffer,
  acceptCounterOffer,
  rejectCounterOffer,
} from "../freelancerRoutes/freelancherFunction.js";
import {
  freelancerAuth,
  requireFreelancer,
} from "../middleware/freelancerAuthMiddleware.js";
import { Router } from "express";
const freelancerRoutes = express.Router();

// All routes require authentication and freelancer role
freelancerRoutes.use(freelancerAuth, requireFreelancer);

// Browse jobs (with filters)
freelancerRoutes.get("/browse", browseJobs);

// Get single job details
freelancerRoutes.get("/jobs/:jobId", getJobDetails);

// Apply to a job
freelancerRoutes.post("/jobs/:jobId/apply", submitProposal);

freelancerRoutes.get("/proposals", getMyProposals);

freelancerRoutes.post(
  "/proposals/:proposalId/counter-response",
  respondToCounterOffer,
);

// Counter offer routes
freelancerRoutes.post(
  "/proposals/:proposalId/counter-accept",
  acceptCounterOffer,
);
freelancerRoutes.post(
  "/proposals/:proposalId/counter-reject",
  rejectCounterOffer,
);

// Get my applications
freelancerRoutes.get("/applications", getMyApplications);

// Save/unsave jobs
freelancerRoutes.post("/jobs/:jobId/save", saveJob);
freelancerRoutes.delete("/jobs/:jobId/unsave", unsaveJob);
freelancerRoutes.get("/saved/all", getSavedJobs);

// Dashboard stats
freelancerRoutes.get("/dashboard/stats", getDashboardStats);

export default freelancerRoutes;
