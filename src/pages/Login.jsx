import { useState } from "react";
import { db } from "../services/firebase";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Login = () => {
  const [activeTab, setActiveTab] = useState("student");

  const [name, setName] = useState("");
  const [regNo, setRegNo] = useState("");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  // 👨‍🎓 Student Login
  const handleStudentLogin = async () => {
    if (!name || !regNo) {
      toast("Please enter all fields", { icon: "⚠️" });
      return;
    }

    const q = query(collection(db, "students"), where("regNo", "==", regNo));
    const snapshot = await getDocs(q);

    let user;

    if (snapshot.empty) {
      const docRef = await addDoc(collection(db, "students"), {
        name,
        regNo
      });

      user = { id: docRef.id, name, regNo };
    } else {
      const existing = snapshot.docs[0];
      user = { id: existing.id, ...existing.data() };
    }

    localStorage.setItem("user", JSON.stringify(user));
    toast.success("Login successful");
    navigate("/tests");
  };

  // 👩‍🏫 Admin Login
  const handleAdminLogin = () => {
    if (username === "admin" && password === "admin123") {
      localStorage.setItem("admin", "true");
      toast.success("Login successful");
      navigate("/admin/dashboard");
    } else {
      toast.error("Invalid credentials");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="p-6 shadow-lg rounded-lg w-96">

        {/* Tabs */}
        <div className="flex mb-4">
          <button
            onClick={() => setActiveTab("student")}
            className={`flex-1 p-2 ${activeTab === "student"
              ? "bg-blue-500 text-white"
              : "bg-gray-200"
              }`}
          >
            Student
          </button>

          <button
            onClick={() => setActiveTab("admin")}
            className={`flex-1 p-2 ${activeTab === "admin"
              ? "bg-black text-white"
              : "bg-gray-200"
              }`}
          >
            Admin
          </button>
        </div>

        {/* Student Form */}
        {activeTab === "student" && (
          <>
            <h2 className="text-xl font-bold mb-4">Student Login</h2>

            <input
              type="text"
              placeholder="Name"
              className="border p-2 w-full mb-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              type="text"
              placeholder="Register Number"
              className="border p-2 w-full mb-3"
              value={regNo}
              onChange={(e) => setRegNo(e.target.value)}
            />

            <button
              onClick={handleStudentLogin}
              className="bg-blue-500 text-white w-full p-2 rounded"
            >
              Login
            </button>
          </>
        )}

        {/* Admin Form */}
        {activeTab === "admin" && (
          <>
            <h2 className="text-xl font-bold mb-4">Admin Login</h2>

            <input
              type="text"
              placeholder="Username"
              className="border p-2 w-full mb-3"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              className="border p-2 w-full mb-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              onClick={handleAdminLogin}
              className="bg-black text-white w-full p-2 rounded"
            >
              Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;