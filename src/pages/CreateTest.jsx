import { useState } from "react";
import { db } from "../services/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const CreateTest = () => {
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [duration, setDuration] = useState("");
    const [questions, setQuestions] = useState([
        {
            question: "",
            options: ["", "", "", ""],
            correctAnswer: ""
        }
    ]);

    const handleQuestionChange = (index, field, value) => {
        const updated = [...questions];
        updated[index][field] = value;
        setQuestions(updated);
    };

    const handleOptionChange = (qIndex, optIndex, value) => {
        const updated = [...questions];
        updated[qIndex].options[optIndex] = value;
        setQuestions(updated);
    };

    const addQuestion = () => {
        setQuestions([
            ...questions,
            {
                question: "",
                options: ["", "", "", ""],
                correctAnswer: ""
            }
        ]);
    };

    const handleSubmit = async () => {
        if (!title || !duration) {
            toast("Please enter test details", { icon: "⚠️" });
            return;
        }

        // 1. Create test
        const testRef = await addDoc(collection(db, "tests"), {
            title,
            duration: Number(duration)
        });

        // 2. Save each question in pool
        for (let q of questions) {
            if (!q.question || q.options.includes("") || !q.correctAnswer) {
                toast("Please fill all question fields", { icon: "⚠️" });
                return;
            }

            await addDoc(collection(db, "questions"), {
                testId: testRef.id,
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer
            });
        }

        toast.success("Test created successfully");

        navigate("/admin/dashboard");
    };

    return (
        <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Create Test</h2>

            <input
                type="text"
                placeholder="Test Title"
                className="border p-2 w-full mb-3"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />

            <input
                type="number"
                placeholder="Duration (minutes)"
                className="border p-2 w-full mb-4"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
            />

            {questions.map((q, qIndex) => (
                <div key={qIndex} className="border p-4 mb-4 rounded">
                    <input
                        type="text"
                        placeholder={`Question ${qIndex + 1}`}
                        className="border p-2 w-full mb-2"
                        value={q.question}
                        onChange={(e) =>
                            handleQuestionChange(qIndex, "question", e.target.value)
                        }
                    />

                    {q.options.map((opt, optIndex) => (
                        <input
                            key={optIndex}
                            type="text"
                            placeholder={`Option ${optIndex + 1}`}
                            className="border p-2 w-full mb-2"
                            value={opt}
                            onChange={(e) =>
                                handleOptionChange(qIndex, optIndex, e.target.value)
                            }
                        />
                    ))}

                    <input
                        type="text"
                        placeholder="Correct Answer (must match option exactly)"
                        className="border p-2 w-full"
                        value={q.correctAnswer}
                        onChange={(e) =>
                            handleQuestionChange(qIndex, "correctAnswer", e.target.value)
                        }
                    />
                </div>
            ))}

            <button
                onClick={addQuestion}
                className="bg-gray-500 text-white px-4 py-2 mr-3 rounded"
            >
                Add Question
            </button>

            <button
                onClick={handleSubmit}
                className="bg-green-600 text-white px-4 py-2 rounded"
            >
                Save Test
            </button>
        </div>
    );
};

export default CreateTest;