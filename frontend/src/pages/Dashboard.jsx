import React from "react";
import { useAuth } from "../context/AuthContext";
import ClientDashboard from "./ClientDashboard";
import FreelancerDashboard from "./FreelancerDashboard";
const Dashboard = () => {
  const { user } = useAuth();
  console.log(user)
  return (
    <>
      {user.user_type === "CLIENT" ? (
        <ClientDashboard />
      ) : (
        <FreelancerDashboard />
      )}
    </>
  );
};

export default Dashboard;
