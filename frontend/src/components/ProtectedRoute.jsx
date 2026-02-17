import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && user.user_type !== requiredRole) {
        return <Navigate to="/unauthorized" replace />;
    }

    // Allow access
    return children;
};

export default ProtectedRoute;
