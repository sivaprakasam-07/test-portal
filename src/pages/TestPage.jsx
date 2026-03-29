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
    const hasSubmittedRef = useRef(false);
    const tabWarningShownRef = useRef(false);
    const tabAutoSubmitTriggeredRef = useRef(false);
    const fullscreenAutoSubmitTriggeredRef = useRef(false);
    const timerExpiredTriggeredRef = useRef(false);
    const timerStartedRef = useRef(false);

    const questionsRef = useRef([]);
    const answersRef = useRef([]);
    const attemptDocIdRef = useRef(null);
    const timeLeftRef = useRef(0);

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
                    attemptDocIdRef.current = newAttempt.id;
                    setQuestions(selected);
                    questionsRef.current = selected;

                } else {
                    const docData = attemptSnap.docs[0];

                    if (docData.data().isCompleted) {
                        toast("You already completed this test", { icon: "⚠️" });
                        navigate("/tests");
                        return;
                    }

                    setAttemptDocId(docData.id);
                    attemptDocIdRef.current = docData.id;
                    const assignedQuestions = docData.data().assignedQuestions || [];
                    setQuestions(assignedQuestions);
                    questionsRef.current = assignedQuestions;
                }

                // 🔹 Fetch test duration
                const testSnap = await getDocs(
                    query(collection(db, "tests"), where("__name__", "==", testId))
                );

                if (!testSnap.empty) {
                    const duration = testSnap.docs[0].data().duration;
                    const totalSeconds = duration * 60;
                    setTimeLeft(totalSeconds);
                    timeLeftRef.current = totalSeconds;
                    timerStartedRef.current = true;
                }

            } catch (error) {
                toast.error("Failed to load test");
            }
        };

        initTest();
    }, [testId]);

    useEffect(() => {
        questionsRef.current = questions;
    }, [questions]);

    useEffect(() => {
        answersRef.current = answers;
    }, [answers]);

    useEffect(() => {
        attemptDocIdRef.current = attemptDocId;
    }, [attemptDocId]);

    useEffect(() => {
        timeLeftRef.current = timeLeft;
    }, [timeLeft]);

    const handleSubmit = async (showSuccessToast = true) => {
        if (hasSubmittedRef.current) return;

        const currentAttemptDocId = attemptDocIdRef.current;
        if (!currentAttemptDocId) return;

        hasSubmittedRef.current = true;

        let score = 0;

        questionsRef.current.forEach((q, index) => {
            if (answersRef.current[index] === q.correctAnswer) {
                score++;
            }
        });

        await updateDoc(doc(db, "attempts", currentAttemptDocId), {
            answers: answersRef.current,
            score,
            isCompleted: true,
            tabSwitchCount: tabSwitchCount.current
        });

        if (showSuccessToast) {
            toast.success("Test submitted successfully");
        }
        navigate("/tests");
    };

    // ⏱️ Timer
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (!timerStartedRef.current || hasSubmittedRef.current) {
                    return prev;
                }

                if (prev <= 1) {
                    if (!timerExpiredTriggeredRef.current && questionsRef.current.length > 0) {
                        timerExpiredTriggeredRef.current = true;
                        toast.error("Time's up! Submitting...");
                        handleSubmit(false);
                    }
                    return 0;
                }

                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // 🚫 Tab switch
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden || hasSubmittedRef.current) {
                return;
            }

            tabSwitchCount.current++;

            if (!tabWarningShownRef.current) {
                tabWarningShownRef.current = true;
                toast.error("Tab switch detected");
                return;
            }

            if (!tabAutoSubmitTriggeredRef.current) {
                tabAutoSubmitTriggeredRef.current = true;
                toast.error("Cheating detected! Auto submitting...");
                handleSubmit(false);
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            if (
                !document.fullscreenElement &&
                questionsRef.current.length > 0 &&
                !hasSubmittedRef.current &&
                !fullscreenAutoSubmitTriggeredRef.current
            ) {
                fullscreenAutoSubmitTriggeredRef.current = true;
                toast.error("Fullscreen exited! Auto submitting...");
                handleSubmit(false);
            }
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);

        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, []);

    const handleSelect = (qIndex, option) => {
        const updated = [...answers];
        updated[qIndex] = option;
        setAnswers(updated);
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