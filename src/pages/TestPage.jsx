import { useEffect, useState, useRef } from "react";
import { db } from "../services/firebase";
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    doc
} from "firebase/firestore";
import toast from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";

const TestPage = () => {
    const { testId } = useParams();
    const navigate = useNavigate();

    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState([]);
    const [attemptDocId, setAttemptDocId] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);

    const tabSwitchCount = useRef(0);
    const user = JSON.parse(localStorage.getItem("user"));

    const shuffleArray = (array) => {
        return [...array].sort(() => Math.random() - 0.5);
    };
    useEffect(() => {
        const enterFullscreen = () => {
            const elem = document.documentElement;

            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            }
        };

        enterFullscreen();
    }, []);

    useEffect(() => {
        const initTest = async () => {
            try {
                // 🔹 Check attempt
                const qAttempt = query(
                    collection(db, "attempts"),
                    where("regNo", "==", user.regNo),
                    where("testId", "==", testId)
                );

                const attemptSnap = await getDocs(qAttempt);

                if (attemptSnap.empty) {
                    // 🔹 Fetch questions from pool
                    const qQuestions = query(
                        collection(db, "questions"),
                        where("testId", "==", testId)
                    );

                    const qSnap = await getDocs(qQuestions);

                    let allQuestions = qSnap.docs.map(doc => doc.data()) || [];

                    if (allQuestions.length === 0) {
                        toast.error("No questions found for this test");
                        return;
                    }

                    // 🔹 Shuffle + pick 5
                    const selected = shuffleArray(allQuestions).slice(0, 5);

                    // 🔹 Create attempt
                    const newAttempt = await addDoc(collection(db, "attempts"), {
                        name: user.name,
                        regNo: user.regNo,
                        testId,
                        assignedQuestions: selected,
                        answers: [],
                        score: 0,
                        tabSwitchCount: 0,
                        isCompleted: false
                    });

                    setAttemptDocId(newAttempt.id);
                    setQuestions(selected);

                } else {
                    const docData = attemptSnap.docs[0];

                    if (docData.data().isCompleted) {
                        toast("You already completed this test", { icon: "⚠️" });
                        navigate("/tests");
                        return;
                    }

                    setAttemptDocId(docData.id);
                    setQuestions(docData.data().assignedQuestions || []);
                }

                // 🔹 Fetch test duration
                const testSnap = await getDocs(
                    query(collection(db, "tests"), where("__name__", "==", testId))
                );

                if (!testSnap.empty) {
                    const duration = testSnap.docs[0].data().duration;
                    setTimeLeft(duration * 60);
                }

            } catch (error) {
                toast.error("Failed to load test");
            }
        };

        initTest();
    }, [testId]);

    // ⏱️ Timer
    useEffect(() => {
        if (timeLeft <= 0 && questions.length > 0) {
            toast.error("Time's up! Submitting...");
            handleSubmit();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    // 🚫 Tab switch
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                tabSwitchCount.current++;
                toast.error("Tab switch detected");

                if (tabSwitchCount.current > 1) {
                    toast.error("Cheating detected! Auto submitting...");
                    handleSubmit();
                }
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && questions.length > 0) {
                toast.error("Fullscreen exited! Auto submitting...");
                handleSubmit();
            }
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);

        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, [questions, attemptDocId, answers]);

    const handleSelect = (qIndex, option) => {
        const updated = [...answers];
        updated[qIndex] = option;
        setAnswers(updated);
    };

    const handleSubmit = async () => {
        if (!attemptDocId) return;

        let score = 0;

        questions.forEach((q, index) => {
            if (answers[index] === q.correctAnswer) {
                score++;
            }
        });

        await updateDoc(doc(db, "attempts", attemptDocId), {
            answers,
            score,
            isCompleted: true,
            tabSwitchCount: tabSwitchCount.current
        });

        toast.success("Test submitted successfully");
        navigate("/tests");
    };

    return (
        <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Test</h2>

            {/* Timer */}
            <h3 className="text-red-600 font-bold mb-4">
                Time Left: {Math.floor(timeLeft / 60)}:
                {String(timeLeft % 60).padStart(2, "0")}
            </h3>

            {/* Safe rendering */}
            {questions && questions.length > 0 ? (
                questions.map((q, index) => (
                    <div key={index} className="mb-4 border p-4 rounded">
                        <p className="font-semibold">
                            {index + 1}. {q.question}
                        </p>

                        {q.options?.map((opt, i) => (
                            <label key={i} className="block">
                                <input
                                    type="radio"
                                    name={`q-${index}`}
                                    value={opt}
                                    onChange={() => handleSelect(index, opt)}
                                />
                                {opt}
                            </label>
                        ))}
                    </div>
                ))
            ) : (
                <p>Loading questions...</p>
            )}

            <button
                onClick={handleSubmit}
                className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
            >
                Submit Test
            </button>
        </div>
    );
};

export default TestPage; 