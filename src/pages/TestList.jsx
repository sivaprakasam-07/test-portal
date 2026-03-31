import { useEffect, useState } from "react";
import { db } from "../services/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";

const TestList = () => {
  const [tests, setTests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTests = async () => {
      const snapshot = await getDocs(collection(db, "tests"));
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTests(data);
    };

    fetchTests();
  }, []);

  const startTest = (testId) => {
    navigate(`/test/${testId}`);
  };
  const handleBackNavigation = () => {
    {
      navigate("/");
    }
  };
  return (
    <div className="p-6">
      <BackButton onClick={handleBackNavigation} className="mb-4" />
      <h2 className="text-xl font-bold mb-4">Available Tests</h2>

      {tests.map((test) => (
        <div key={test.id} className="border p-4 mb-3 rounded">
          <h3 className="font-semibold">{test.title}</h3>
          <p>Duration: {test.duration} mins</p>

          <button
            onClick={() => startTest(test.id)}
            className="mt-2 bg-green-500 text-white px-4 py-1 rounded"
          >
            Start Test
          </button>
        </div>
      ))}
    </div>
  );
};

export default TestList;