import { useEffect, useState } from "react";
import { db } from "../services/firebase";
import {
    collection,
    getDocs,
    deleteDoc,
    doc,
    query,
    where
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const AdminDashboard = () => {
    const [tests, setTests] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTests();
    }, []);

    const fetchTests = async () => {
        const snapshot = await getDocs(collection(db, "tests"));
        const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }));
        setTests(data);
    };

    const deleteTest = async (testId) => {
        if (!confirm("Are you sure to delete this test?")) {
            toast("Delete cancelled", { icon: "⚠️" });
            return;
        }

        try {
            // 🔹 Delete test
            await deleteDoc(doc(db, "tests", testId));

            // 🔹 Delete related questions
            const qQuestions = query(
                collection(db, "questions"),
                where("testId", "==", testId)
            );
            const qSnap = await getDocs(qQuestions);

            for (let d of qSnap.docs) {
                await deleteDoc(doc(db, "questions", d.id));
            }

            // 🔹 Delete related attempts
            const qAttempts = query(
                collection(db, "attempts"),
                where("testId", "==", testId)
            );
            const aSnap = await getDocs(qAttempts);

            for (let d of aSnap.docs) {
                await deleteDoc(doc(db, "attempts", d.id));
            }

            toast.success("Test deleted successfully");

            fetchTests(); // refresh UI

        } catch (error) {
            toast.error("Failed to delete test");
        }
    };

    const logout = () => {
        localStorage.removeItem("admin");
        navigate("/");
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>

            <button
                onClick={() => navigate("/admin/create")}
                className="bg-blue-500 text-white px-4 py-2 mr-3 rounded"
            >
                Create Test
            </button>

            <button
                onClick={() => navigate("/admin/results")}
                className="bg-green-500 text-white px-4 py-2 mr-3 rounded"
            >
                View Results
            </button>

            <button
                onClick={logout}
                className="bg-red-500 text-white px-4 py-2 rounded"
            >
                Logout
            </button>

            {/* 🔥 Test List */}
            <h3 className="text-xl font-semibold mt-6 mb-3">All Tests</h3>

            {tests.map((test) => (
                <div
                    key={test.id}
                    className="border p-4 mb-3 rounded flex justify-between items-center"
                >
                    <div>
                        <p className="font-semibold">{test.title}</p>
                        <p>Duration: {test.duration} mins</p>
                    </div>

                    <button
                        onClick={() => deleteTest(test.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded"
                    >
                        Delete
                    </button>
                </div>
            ))}
        </div>
    );
};

export default AdminDashboard;