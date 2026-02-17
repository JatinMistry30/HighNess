import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Public pages
import Login from "../components/Login";
import Register from "../components/Register";
import Home from "../pages/Home";
import Unauthorized from "../pages/Unauthorized";

// Layout and route guards
import Layout from "../components/Layout";
import ProtectedRoute from "../components/ProtectedRoute";
import PublicRoute from "../components/PublicRoute";

// Shared pages
import Dashboard from "../pages/Dashboard";

// Client pages
import PostJobs from "../pages/PostJobs";
import JobDetails from "../components/JobDetails";
import JobProposals from "../pages/JobProposals";
import ClientContractReview from "../pages/ClientContractReview";

// Freelancer pages
import JobDetailsFreelancer from "../components/JobDetailsFreelancer";
import ContractCreation from "../pages/ContractCreation";
import ContractDetails from "../components/ContractDetails";
import Workspace from "../pages/Workspace/Workspace";
import WorkspaceMain from "../pages/Workspace/WorkspaceMain";
import DrawArea from "../pages/Workspace/DrawArea";

//User auth
import { useAuth } from "../context/AuthContext";
const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Router>
      <Layout>
        <Routes>
          // Public routes
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route path="/unauthorized" element={<Unauthorized />} />
          // Shared authenticated routes
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          // Client routes
          <Route
            path="/client/post-job"
            element={
              <ProtectedRoute requiredRole="CLIENT">
                <PostJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/jobs/:jobId"
            element={
              <ProtectedRoute requiredRole="CLIENT">
                <JobDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/jobs/:jobId/edit"
            element={
              <ProtectedRoute requiredRole="CLIENT">
                <JobDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/jobs/:jobId/proposals"
            element={
              <ProtectedRoute requiredRole="CLIENT">
                <JobProposals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contracts/:contractId/review"
            element={
              <ProtectedRoute requiredRole="CLIENT">
                <ClientContractReview />
              </ProtectedRoute>
            }
          />
          {/* // Freelancer routes */}
          <Route
            path="/jobs/:jobId"
            element={
              <ProtectedRoute>
                <JobDetailsFreelancer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contracts/new/:proposalId"
            element={
              <ProtectedRoute>
                <ContractCreation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contracts/:contractId"
            element={
              <ProtectedRoute requiredRole="FREELANCER">
                <ContractDetails />
              </ProtectedRoute>
            }
          />
          {/* Workspace(Connected to both) */}
          <Route
            path="/workspace"
            element={
              <ProtectedRoute>
                <Workspace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workspace/:id"
            element={
              <ProtectedRoute>
                <WorkspaceMain />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workspace/draw-area"
            element={
              <ProtectedRoute>
                <DrawArea />
              </ProtectedRoute>
            }
          />
          {/* // Fallback */}
          <Route path="*" element={<div>Page not found</div>} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default AppRoutes;
