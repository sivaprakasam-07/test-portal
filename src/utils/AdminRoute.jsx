import { Navigate } from "react-router-dom";

const AdminRoute = ({ children }) => {
  const isAdmin = localStorage.getItem("admin");

  return isAdmin ? children : <Navigate to="/admin" />;
};

export default AdminRoute;