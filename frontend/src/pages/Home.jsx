import React from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import FreelancerHome from "./FreelancerHome";
const Home = () => {
  const { user } = useAuth();

  // If user is a client
  if (user?.user_type === "CLIENT") {
    return <Navigate to="/dashboard" replace />;
  }

  // If user is a freelancer
    if (user?.user_type === "FREELANCER") {
    return <FreelancerHome />
  }
  return <div>Home</div>;
};

export default Home;
