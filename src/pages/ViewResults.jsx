import { useEffect, useState } from "react";
import { db } from "../services/firebase";
import { collection, getDocs } from "firebase/firestore";

const ViewResults = () => {
  const [attempts, setAttempts] = useState([]);

  useEffect(() => {
    const fetchResults = async () => {
      const snapshot = await getDocs(collection(db, "attempts"));

      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setAttempts(data);
    };

    fetchResults();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Student Results</h2>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Name</th>
            <th className="border p-2">Reg No</th>
            <th className="border p-2">Score</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Test ID</th>
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
              <td className="border p-2">{a.testId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ViewResults;