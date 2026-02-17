import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; 
import api from "../services/api";
import { Link } from "react-router-dom";
import { Download, CheckCircle, XCircle, Edit3 } from "lucide-react";

const ClientContractReview = () => {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // For user type check

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  // Contract status states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchContract();
  }, [contractId]);

  const fetchContract = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/contract/${contractId}`);
      if (res.data.success) {
        setContract(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load contract");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setPdfLoading(true);
      const response = await api.get(`/contract/${contractId}/pdf`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Contract-${contractId}-Review.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Failed to download PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleAcceptContract = async () => {
    try {
      setActionLoading(true);
      // TODO: Update backend to handle contract acceptance
      await api.post(`/contract/${contractId}/accept`, {
        client_signed: true,
        signed_at: new Date().toISOString(),
      });
      alert("Contract accepted! Project workspace opening...");
      navigate("/dashboard");
    } catch (error) {
      alert("Failed to accept contract");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectContract = async () => {
    if (!rejectReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    try {
      setActionLoading(true);
      await api.post(`/contract/${contractId}/reject`, {
        rejection_reason: rejectReason,
      });
      alert("Contract rejected. Freelancer notified.");
      navigate("/dashboard");
    } catch (error) {
      alert("Failed to reject contract");
    } finally {
      setActionLoading(false);
      setShowRejectModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full mx-4">
          <div className="text-center text-red-600 mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Contract Not Found
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const canAccess = contract.client_id === user.id;
  if (!canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full mx-4">
          <div className="text-center text-yellow-600 mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to view this contract.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-xl hover:bg-indigo-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const totalAmount = Number(contract.total_amount || 0);
  const milestones = contract.milestones || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Contract Review #{contract.id}
                </h1>
              </div>
              <p className="text-xl text-slate-600">
                Review and accept this contract
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-2xl hover:bg-slate-50 transition-all"
              >
                Back to Dashboard
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={pdfLoading}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {pdfLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download PDF
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Contract Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-50 rounded-2xl">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">
                ₹{totalAmount.toLocaleString()}
              </div>
              <div className="text-sm text-slate-600">Total Amount</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">
                {contract.timeline_days || "?"} days
              </div>
              <div className="text-sm text-slate-600">Timeline</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">
                {milestones.length}
              </div>
              <div className="text-sm text-slate-600">Milestones</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Contract Details */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <Edit3 className="w-6 h-6 text-slate-400" />
              Contract Terms
            </h2>

            {/* Parties */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="p-6 border border-slate-200 rounded-2xl">
                <h3 className="font-semibold text-slate-800 mb-2">
                  Freelancer
                </h3>
                <p className="text-slate-600">{contract.freelancer_name}</p>
                <p className="text-sm text-slate-500">
                  {contract.freelancer_email}
                </p>
              </div>
              <div className="p-6 border border-slate-200 rounded-2xl">
                <h3 className="font-semibold text-slate-800 mb-2">
                  Your Details
                </h3>
                <p className="text-slate-600">{contract.client_name}</p>
                <p className="text-sm text-slate-500">
                  {contract.client_email}
                </p>
              </div>
            </div>

            {/* Scope */}
            <div className="mb-8">
              <h3 className="font-semibold text-slate-800 mb-3">
                Project Scope
              </h3>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <p className="text-slate-700 whitespace-pre-wrap">
                  {contract.project_scope}
                </p>
              </div>
            </div>

            {/* Custom Terms */}
            {contract.custom_terms && (
              <div className="mb-8">
                <h3 className="font-semibold text-slate-800 mb-3">
                  Custom Terms
                </h3>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">
                    {contract.custom_terms}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Milestones & Actions */}
          <div className="space-y-6">
            {/* Milestones */}
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Payment Milestones
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl border border-slate-200 hover:shadow-md transition-all"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">
                        {milestone.milestone_number}. {milestone.title}
                      </div>
                      <div className="text-sm text-slate-600">
                        {milestone.description}
                      </div>
                      {milestone.due_date && (
                        <div className="text-xs text-slate-500">
                          Due:{" "}
                          {new Date(milestone.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-emerald-600">
                        ₹{Number(milestone.amount).toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500">
                        {milestone.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-3xl shadow-xl border border-slate-200 p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-4">
                Ready to proceed?
              </h3>

              {contract.status === "PENDING_CLIENT" ? (
                <div className="flex flex-col items-center justify-center gap-4 p-6 bg-emerald-100 rounded-2xl text-emerald-700 font-semibold text-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6" />
                    You have accepted this contract
                  </div>

                  <Link
                    to="/workspace"
                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold shadow hover:bg-emerald-700 transition"
                  >
                    Go to Workspace
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={handleAcceptContract}
                    disabled={actionLoading}
                    className="group flex items-center justify-center gap-3 px-8 py-6 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl hover:from-emerald-600 hover:to-green-700 transform hover:-translate-y-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <CheckCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    {actionLoading ? "Processing..." : "Accept & Sign Contract"}
                  </button>

                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-3 px-8 py-6 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl hover:from-red-600 hover:to-red-700 transform hover:-translate-y-1 transition-all duration-200 disabled:opacity-50"
                  >
                    <XCircle className="w-6 h-6" />
                    Reject Contract
                  </button>
                </div>
              )}

              <p className="text-xs text-slate-500 mt-4 text-center">
                By accepting, you agree to the contract terms and Highness
                platform policies
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              Reject Contract
            </h3>
            <p className="text-slate-600 mb-6">
              Please provide a reason for rejection. The freelancer will be
              notified.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Budget too high, timeline unrealistic, scope unclear..."
              rows={4}
              className="w-full p-4 border border-slate-300 rounded-2xl resize-vertical focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-2xl hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectContract}
                disabled={actionLoading || !rejectReason.trim()}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-2xl font-semibold hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {actionLoading ? "Rejecting..." : "Reject Contract"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientContractReview;
