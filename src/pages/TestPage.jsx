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
import BackButton from "../components/BackButton";

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
  const backConfirmAtRef = useRef(0);

  const questionsRef = useRef([]);
  const answersRef = useRef([]);
  const attemptDocIdRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user"));

  const shuffleArray = (array) => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  useEffect(() => {
    const enterFullscreen = () => {
      const elem = document.documentElement;
      if (elem.requestFullscreen) elem.requestFullscreen();
    };
    enterFullscreen();
  }, []);

  useEffect(() => {
    const initTest = async () => {
      try {
        const qAttempt = query(
          collection(db, "attempts"),
          where("regNo", "==", user.regNo),
          where("testId", "==", testId)
        );

        const attemptSnap = await getDocs(qAttempt);

        if (attemptSnap.empty) {
          const qQuestions = query(
            collection(db, "questions"),
            where("testId", "==", testId)
          );

          const qSnap = await getDocs(qQuestions);
          let allQuestions = qSnap.docs.map(doc => doc.data()) || [];

          if (allQuestions.length === 0) {
            toast.error("No questions found");
            return;
          }

          const selected = shuffleArray(allQuestions).slice(0, 5);

          const newAttempt = await addDoc(collection(db, "attempts"), {
            name: user.name,
            regNo: user.regNo,
            testId,
            assignedQuestions: selected,
            answers: [],
            score: 0,
            tabSwitchCount: 0,
            isCompleted: false,
            isAllowed: false
          });

          setAttemptDocId(newAttempt.id);
          attemptDocIdRef.current = newAttempt.id;
          setQuestions(selected);
          questionsRef.current = selected;

        } else {
          const docData = attemptSnap.docs[0];
          const attemptData = docData.data();

          // ✅ One attempt restriction + admin override
          if (attemptData.isCompleted && !attemptData.isAllowed) {
            toast.error("You have already completed this test");
            navigate("/tests");
            return;
          }

          setAttemptDocId(docData.id);
          attemptDocIdRef.current = docData.id;

          const assignedQuestions = attemptData.assignedQuestions || [];
          setQuestions(assignedQuestions);
          questionsRef.current = assignedQuestions;
        }

        const testSnap = await getDocs(
          query(collection(db, "tests"), where("__name__", "==", testId))
        );

        if (!testSnap.empty) {
          const duration = testSnap.docs[0].data().duration;
          const totalSeconds = duration * 60;
          setTimeLeft(totalSeconds);
          timerStartedRef.current = true;
        }

      } catch (err) {
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

  const isTestActive = () => {
    return !hasSubmittedRef.current && questionsRef.current.length > 0;
  };

  const handleBackNavigation = () => {
    if (!isTestActive()) {
      navigate(-1);
      return;
    }

    const now = Date.now();

    if (now - backConfirmAtRef.current > 3000) {
      backConfirmAtRef.current = now;
      toast("Press back again to submit and exit", { icon: "⚠️" });
      return;
    }

    handleSubmit(false);
  };

  const handleSubmit = async (showToast = true) => {
    if (hasSubmittedRef.current) return;

    const id = attemptDocIdRef.current;
    if (!id) return;

    hasSubmittedRef.current = true;

    let score = 0;

    questionsRef.current.forEach((q, i) => {
      if (answersRef.current[i] === q.correctAnswer) score++;
    });

    await updateDoc(doc(db, "attempts", id), {
      answers: answersRef.current,
      score,
      isCompleted: true,
      isAllowed: false,
      tabSwitchCount: tabSwitchCount.current
    });

    if (showToast) toast.success("Test submitted");
    navigate("/tests");
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (hasSubmittedRef.current) return prev;

        if (prev <= 1) {
          if (!timerExpiredTriggeredRef.current) {
            timerExpiredTriggeredRef.current = true;
            toast.error("Time's up!");
            handleSubmit(false);
          }
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden || hasSubmittedRef.current) return;

      tabSwitchCount.current++;

      if (!tabWarningShownRef.current) {
        tabWarningShownRef.current = true;
        toast("Do not switch tabs", { icon: "⚠️" });
        return;
      }

      if (!tabAutoSubmitTriggeredRef.current) {
        tabAutoSubmitTriggeredRef.current = true;
        toast.error("Cheating detected");
        handleSubmit(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    const handleFullscreen = () => {
      if (
        !document.fullscreenElement &&
        !hasSubmittedRef.current &&
        !fullscreenAutoSubmitTriggeredRef.current
      ) {
        fullscreenAutoSubmitTriggeredRef.current = true;
        toast.error("Fullscreen exited");
        handleSubmit(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreen);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreen);
  }, []);

  const handleSelect = (i, opt) => {
    const updated = [...answers];
    updated[i] = opt;
    setAnswers(updated);
  };

  return (
    <div className="p-6">
      <BackButton onClick={handleBackNavigation} className="mb-4" />

      <h2 className="text-xl font-bold mb-4">Test</h2>

      <h3 className="text-red-600 font-bold mb-4">
        Time Left: {Math.floor(timeLeft / 60)}:
        {String(timeLeft % 60).padStart(2, "0")}
      </h3>

      {questions.length > 0 ? (
        questions.map((q, i) => (
          <div key={i} className="border p-4 mb-4 rounded">
            <p className="font-semibold">{i + 1}. {q.question}</p>

            {q.options?.map((opt, j) => (
              <label key={j} className="block">
                <input
                  type="radio"
                  name={`q-${i}`}
                  onChange={() => handleSelect(i, opt)}
                />
                {opt}
              </label>
            ))}
          </div>
        ))
      ) : (
        <p>Loading...</p>
      )}

      <button
        onClick={() => handleSubmit(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Submit
      </button>
    </div>
  );
};

export default TestPage;