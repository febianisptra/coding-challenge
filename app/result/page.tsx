"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ResultPage = () => {
  const [answers, setAnswers] = useState<{ [key: number]: string | null }>({});
  const [questions, setQuestions] = useState<any[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const router = useRouter();

  const savedUserName = localStorage.getItem("userName");
    if (!savedUserName) {
        localStorage.removeItem("userName");
        localStorage.removeItem("quizAnswers");
        localStorage.removeItem("timeLeft");
        localStorage.removeItem("isQuizSubmitted");
        router.push('/');
        return;
    }

  useEffect(() => {
    const savedAnswers = localStorage.getItem("quizAnswers");
    const fetchQuestions = async () => {
      const response = await fetch(
        "https://pacmann-frontend.pacmann.workers.dev"
      );
      const data = await response.json();
      setQuestions(data.data);
    };

    if (savedAnswers) {
      setAnswers(JSON.parse(savedAnswers));
    }
    fetchQuestions();
  }, []);
  
  useEffect(() => {
    if (questions.length > 0 && Object.keys(answers).length > 0) {
      const correct = Object.entries(answers).reduce((acc, [index, answer]) => {
        return acc + (answer === questions[Number(index)]?.correctAnswer ? 1 : 0);
      }, 0);
      setCorrectCount(correct);
    }
  }, [questions, answers]);
  
  const handleBackToHome = () => {
    localStorage.removeItem("userName");
    localStorage.removeItem("quizAnswers");
    localStorage.removeItem("timeLeft");
    localStorage.removeItem("isQuizSubmitted");
    router.push("/");
  };

  const getAnswerValue = (question: any, answerLabel: string | null) => {
    if (!answerLabel) return "Tidak ada jawaban";
    const option = question.options.find((opt: any) => opt.label === answerLabel);
    return option ? option.value : "Jawaban tidak ditemukan";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-10">
        <h1 className="text-2xl font-bold mb-4 text-black">Quiz Results</h1>
        <div className="w-full max-w-3xl flex items-center justify-between">
            <p className="text-sm text-black/80 font-medium mt-2">Name: {savedUserName}</p>
            <p className="text-sm text-black/80 font-medium">Skor: {correctCount} / {questions.length}</p>
        </div>
      <div className="w-full max-w-3xl p-4 bg-white shadow-md rounded-md">
        {questions.map((question, index) => (
          <div key={index} className="mb-4">
            <h2 className="text-lg font-semibold text-black">
              {index + 1}. {question.question}
            </h2>
            <p
              className={`mt-2 ${
                answers[index] === question.correctAnswer
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              Your answer: {getAnswerValue(question, answers[index])}
            </p>
            {answers[index] !== question.correctAnswer && (
              <p className="text-blue-600">
                Correct answer: {getAnswerValue(question, question.correctAnswer)}
              </p>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={handleBackToHome}
        className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-md"
      >
        Back to Home
      </button>
    </div>
  );
};

export default ResultPage;
