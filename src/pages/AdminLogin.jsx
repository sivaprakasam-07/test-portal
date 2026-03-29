import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const AdminLogin = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = () => {
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
            <div className="p-6 shadow-lg rounded-lg w-80">
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
                    onClick={handleLogin}
                    className="bg-black text-white w-full p-2 rounded"
                >
                    Login
                </button>
            </div>
        </div>
    );
};

export default AdminLogin;