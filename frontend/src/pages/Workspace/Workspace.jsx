import React, { useEffect, useState } from "react";
import axios from "axios";
import api from "../../services/api";

const Workspace = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        setLoading(true);
        const res = await api.get("/workspace/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (res.data.success) {
          setWorkspaces(res.data.workspaces);
        } else {
          setError("Failed to fetch workspaces");
        }
      } catch (err) {
        console.error(err);
        setError("Something went wrong while fetching workspaces");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaces();
  }, []);

  if (loading) return <div className="p-6">Loading workspaces...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-8 grid gap-6">
      {workspaces.length === 0 && (
        <div className="text-slate-600">No workspaces found.</div>
      )}

      {workspaces.map((ws) => (
        <div
          key={ws.id}
          className="p-6 rounded-2xl bg-slate-100 shadow-md hover:shadow-lg transition-shadow"
        >
          {/* Personalized Welcome */}
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Hey{" "}
            {ws.user_type === "FREELANCER"
              ? ws.freelancer_full_name
              : ws.client_full_name}
            , Welcome 👋
          </h2>

          <p className="text-slate-600 mb-2">
            Role: {ws.user_type === "FREELANCER" ? "Freelancer" : "Client"}
          </p>

          <p className="text-slate-600">
            Workspace for Contract ID: <strong>{ws.contract_id}</strong>
          </p>

          {/* Go to Workspace button */}
          <button
            onClick={() => window.location.href = `/workspace/${ws.id}`}
            className="mt-4 px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
          >
            Go to Workspace
          </button>
        </div>
      ))}
    </div>
  );
};

export default Workspace;
