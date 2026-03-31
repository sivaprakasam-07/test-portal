import { useEffect, useState } from "react";
import { db } from "../services/firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "firebase/firestore";
import BackButton from "../components/BackButton";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

const ViewResults = () => {
  const [attempts, setAttempts] = useState([]);

  const fetchResults = async () => {
    const snapshot = await getDocs(collection(db, "attempts"));

    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    setAttempts(data);
  };

  useEffect(() => {
    fetchResults();
  }, []);

  // ✅ Export Excel
  const exportToExcel = () => {
    const formatted = attempts.map(a => ({
      Name: a.name,
      RegNo: a.regNo,
      Score: a.score,
      Status: a.isCompleted ? "Completed" : "Not Completed"
    }));

    const worksheet = XLSX.utils.json_to_sheet(formatted);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
    XLSX.writeFile(workbook, "test-results.xlsx");

    toast.success("Results exported");
  };

  // ✅ Allow Reattempt
  const allowReattempt = async (id) => {
    try {
      await updateDoc(doc(db, "attempts", id), {
        isAllowed: true,
        isCompleted: false,
        score: 0,
        answers: []
      });

      toast.success("Student allowed for reattempt");
      fetchResults();
    } catch (err) {
      toast.error("Failed to update");
    }
  };

  return (
    <div className="p-6">
      <BackButton to="/admin/dashboard" className="mb-4" />

      <h2 className="text-2xl font-bold mb-4">Student Results</h2>

      {/* ✅ Export Button */}
      <button
        onClick={exportToExcel}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
      >
        Export to Excel
      </button>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Name</th>
            <th className="border p-2">Reg No</th>
            <th className="border p-2">Score</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>

        <tbody>
          {attempts.map((a) => (
            <tr key={a.id}>
              <td className="border p-2">{a.name}</td>
              <td className="border p-2">{a.regNo}</td>
              <td className="border p-2">{a.score}</td>
              <td className="border p-2">
                {a.isCompleted ? "Completed" : "In Progress"}
              </td>

              {/* ✅ Allow button */}
              <td className="border p-2">
                <button
                  onClick={() => allowReattempt(a.id)}
                  disabled={a.isAllowed}
                  className={`px-2 py-1 rounded text-white ${a.isAllowed ? "bg-gray-400 cursor-not-allowed" : "bg-green-600"
                    }`}
                >
                  {a.isAllowed ? "Allowed" : "Allow"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ViewResults;