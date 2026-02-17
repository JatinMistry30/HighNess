import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

const ContractDetails = () => {
  const { contractId } = useParams();
  const navigate = useNavigate();

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchContract = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/contract/${contractId}`);
        if (res.data.success) {
          setContract(res.data.data);
        } else {
          setError("Failed to load contract");
        }
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.message || "Failed to load contract details",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchContract();
  }, [contractId]);

  const handleDownloadPDF = async () => {
    try {
      setLoading(true);

      // Fetch PDF with proper auth headers via axios
      const response = await api.get(`/contract/${contractId}/pdf`, {
        responseType: "blob", // IMPORTANT: tells axios to return Blob
      });

      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement("a");
      link.href = url;
      link.download = `Contract-${contract.id}-${contract.job_title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600">Loading contract...</div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white shadow rounded-xl px-6 py-4 text-red-600">
          {error || "Contract not found"}
        </div>
      </div>
    );
  }

  const totalAmount = Number(contract.total_amount || 0);
  const milestones = contract.milestones || [];

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Contract #{contract.id}
            </h1>
            <p className="text-sm text-slate-500">
              Job: {contract.job_title} • Status: {contract.status}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm"
            >
              Back
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating PDF...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10l-5.5 5.5m0 0L12 21l5.5-5.5m-5.5 5.5V7"
                    />
                  </svg>
                  Download PDF Contract
                </>
              )}
            </button>
          </div>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700 mb-2">
              Freelancer
            </h2>
            <p className="text-sm text-slate-900">
              {contract.freelancer_name} ({contract.freelancer_email})
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700 mb-2">
              Client
            </h2>
            <p className="text-sm text-slate-900">
              {contract.client_name} ({contract.client_email})
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100 mb-6">
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <div className="text-slate-500">Total Amount</div>
              <div className="font-semibold text-slate-900">
                ₹{totalAmount.toLocaleString("en-IN")}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Timeline</div>
              <div className="font-semibold text-slate-900">
                {contract.timeline_days || "-"} days
              </div>
            </div>
            <div>
              <div className="text-slate-500">Revision Limit</div>
              <div className="font-semibold text-slate-900">
                {contract.revision_limit || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Scope */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100 mb-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-2">
            Project Scope
          </h2>
          <p className="text-sm text-slate-800 whitespace-pre-line">
            {contract.project_scope}
          </p>
        </div>

        {/* Milestones */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100 mb-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            Milestones
          </h2>
          <div className="space-y-2">
            {milestones.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2"
              >
                <div>
                  <div className="font-medium text-slate-900">
                    {m.milestone_number}. {m.title}
                  </div>
                  <div className="text-xs text-slate-500">{m.description}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-emerald-700">
                    ₹{Number(m.amount || 0).toLocaleString("en-IN")}
                  </div>
                  <div className="text-xs text-slate-500">
                    {m.percentage}% • {m.status}
                  </div>
                </div>
              </div>
            ))}
            {milestones.length === 0 && (
              <div className="text-xs text-slate-500">No milestones found.</div>
            )}
          </div>
        </div>

        {/* Custom terms */}
        {(contract.custom_terms || contract.meeting_schedule) && (
          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700 mb-2">
              Terms & Schedule
            </h2>
            {contract.meeting_schedule && (
              <p className="text-sm text-slate-800 mb-1">
                <span className="font-medium">Meetings: </span>
                {contract.meeting_schedule}
              </p>
            )}
            {contract.custom_terms && (
              <p className="text-sm text-slate-800 whitespace-pre-line">
                {contract.custom_terms}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractDetails;
