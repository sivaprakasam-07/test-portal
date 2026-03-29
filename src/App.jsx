import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import TestList from "./pages/TestList";
import TestPage from "./pages/TestPage";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRoute from "./utils/AdminRoute";
import CreateTest from "./pages/CreateTest";
import ViewResults from "./pages/ViewResults";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/tests" element={<TestList />} />
        <Route path="/test/:testId" element={<TestPage />} />

        <Route path="/admin" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/create"
          element={
            <AdminRoute>
              <CreateTest />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/results"
          element={
            <AdminRoute>
              <ViewResults />
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;