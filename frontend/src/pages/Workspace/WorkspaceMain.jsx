import React, { useEffect, useState } from "react";
import api from "../../services/api";
import LeftNavbar from "./LeftNavbar";

const WorkspaceMain = () => {
  const [user, setUser] = useState("");
  const [error, setError] = useState(null);
  const [userType, setUserType] = useState("");
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await api.get("/auth/getme", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (res.data.success) {
          setUser(res.data.user);
          setUserType(res.data.user.user_type);
        } else {
          setError("Failed to fetch the user");
        }
      } catch (error) {
        console.error(error);
        setError("SOmething went wrong while fetching the users");
      }
    };
    fetchCurrentUser();
  }, []);
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  return (
    <>
      <LeftNavbar userType={user.user_type} />
    </>
  );
};

export default WorkspaceMain;
