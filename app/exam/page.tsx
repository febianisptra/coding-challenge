"use client";

import { useState, useEffect } from "react";
import { NextPage } from "next";
import { useRouter } from "next/navigation"

const QuizPage: NextPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerStatus, setAnswerStatus] = useState<string | null>(null); // "correct" | "incorrect"
  const [answers, setAnswers] = useState<{ [key: number]: string | null }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [isUnansweredModalOpen, setIsUnansweredModalOpen] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [unansweredQuestionIndices, setUnansweredQuestionIndices] = useState<
    number[]
  >([]);
  const [unansweredQuestionIndex, setUnansweredQuestionIndex] = useState<
    number | null
  >(null);
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false); // Baru setelah submit dikunci jawabannya
  const [isLoading, setIsLoading] = useState(true);

  const handleAnswerSelect = (selectedLabel: string) => {
    setSelectedAnswer(selectedLabel);

    setAnswers((prevAnswers) => {
      const newAnswers = {
        ...prevAnswers,
        [currentQuestionIndex]: selectedLabel,
      };
      localStorage.setItem("quizAnswers", JSON.stringify(newAnswers));
      return newAnswers;
    });

    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion && selectedLabel === currentQuestion.correctAnswer) {
      setAnswerStatus("correct");
    } else {
      setAnswerStatus("incorrect");
    }
  };


  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const fetchQuestions = async () => {
    try {
      const response = await fetch(
        "https://pacmann-frontend.pacmann.workers.dev"
      );
      const data = await response.json();
      setQuestions(data.data);
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setIsLoading(false); 
    }
  };

  const [userName, setUserName] = useState<string | null>(null);
  const router = useRouter();

  const loadSavedData = () => {
    const savedUserName = localStorage.getItem("userName");
    if (!savedUserName) {
      localStorage.removeItem("userName");
      localStorage.removeItem("quizAnswers");
      localStorage.removeItem("timeLeft");
      localStorage.removeItem("isQuizSubmitted");
      router.push('/');
      return;
    }

    const savedAnswers = localStorage.getItem("quizAnswers");
    const savedTime = localStorage.getItem("timeLeft");
    const savedSubmitStatus = localStorage.getItem("isQuizSubmitted");

    if (savedAnswers) {
      try {
        setAnswers(JSON.parse(savedAnswers));
      } catch (error) {
        console.error("Error parsing saved answers:", error);
      }
    }

    if (savedTime) {
      setTimeLeft(Number(savedTime));
    } else {
      const initialTime = 3600; // 1 hour in seconds
      setTimeLeft(initialTime);
      localStorage.setItem("timeLeft", initialTime.toString());
    }

    if (savedSubmitStatus) {
      setIsQuizSubmitted(JSON.parse(savedSubmitStatus));
    }
  };

  useEffect(() => {
    loadSavedData();
    fetchQuestions();
  }, [router]);

  useEffect(() => {
    localStorage.setItem("quizAnswers", JSON.stringify(answers));
  }, [answers]);

  useEffect(() => {
    if (timeLeft !== null) {
      localStorage.setItem("timeLeft", timeLeft.toString());
    }
  }, [timeLeft]);

  useEffect(() => {
    if (isQuizSubmitted !== null) {
      localStorage.setItem("isQuizSubmitted", JSON.stringify(isQuizSubmitted));
    }
  }, [isQuizSubmitted]);
  
  // Timer untuk menghitung mundur
  useEffect(() => {
    if (timeLeft === null || timeLeft === undefined) return;
  
    const interval = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime === null || prevTime === undefined || prevTime <= 0 || isQuizSubmitted) {
          clearInterval(interval);
          return prevTime;
        }
        const newTime = prevTime - 1;
        localStorage.setItem("timeLeft", newTime.toString());
        return newTime;
      });
    }, 1000);
  
    return () => clearInterval(interval);
  }, [timeLeft, isQuizSubmitted]);  

  // Handle next question
  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setAnswerStatus(null);
    setCurrentQuestionIndex((prevIndex) =>
      Math.min(prevIndex + 1, questions.length - 1)
    );
  };

  // Handle previous question
  const handlePreviousQuestion = () => {
    setSelectedAnswer(null);
    setAnswerStatus(null);
    setCurrentQuestionIndex((prevIndex) => Math.max(prevIndex - 1, 0));
  };

  // Handle question selection from sidebar
  const handleSelectQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setSelectedAnswer(answers[index] || null); // Restore the selected answer for that question
    setAnswerStatus(null); // Reset answer status
  };

  // Format waktu menjadi MM:SS
  const formatTimeLeft = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0"
    )}`;
  };

  const handleSubmit = () => {
    const unansweredIndices = [];
    
    for (let i = 0; i < questions.length; i++) {
      if (!answers[i]) {
        unansweredIndices.push(i + 1);
      }
    }

    if (unansweredIndices.length > 0) {
      setUnansweredQuestionIndices(unansweredIndices);
      setIsUnansweredModalOpen(true);
      return;
    }
    
    setIsQuizSubmitted(true);
    
    const score = Object.values(answers).filter(
      (answer, index) => answer === questions[index].correctAnswer
    ).length;
    
    setFinalScore(score);
    localStorage.setItem("quizAnswers", JSON.stringify(answers));
    localStorage.setItem("finalScore", score.toString());
    
    router.push("/result");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      {isSidebarOpen && (
        <div
          className={`fixed inset-0 z-20 md:relative md:translate-x-0 bg-white shadow-md md:w-64 transition-transform duration-300`}
        >
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Select Question</h2>
            <div className="grid grid-cols-4 gap-4 mb-4">
              {questions.map((_, index) => (
                <button
                  key={index}
                  className={`py-2 px-3 rounded-md text-gray-800 transition ${
                    answers[index] ? "bg-green-200" : "bg-gray-200"
                  } hover:bg-gray-300`}
                  onClick={() => handleSelectQuestion(index)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Overlay for Sidebar (for mobile view) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-30 z-10"
          onClick={closeSidebar}
        />
      )}

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 ${
          isSidebarOpen ? "md:mx-8" : "md:mx-8"
        }`}
      >
         {/* Debug information */}
      <div className="hidden mt-4 p-4 bg-gray-100 rounded-md">
        <h3 className="font-bold">Debug Info:</h3>
        <pre>{JSON.stringify({ answers, timeLeft, isQuizSubmitted }, null, 2)}</pre>
      </div>
        {/* Sidebar Toggle Button (visible on all sizes) */}
        <button
          className="mb-4 bg-blue-600 text-white rounded-md p-2 md:hidden"
          onClick={toggleSidebar}
        >
          {isSidebarOpen ? "Close Menu" : "Open Menu"}
        </button>

        {/* Header Section */}
        <div className="flex justify-between items-center bg-white p-4 rounded-md shadow-md">
          {/* Loading Message */}
            {isLoading && (
              <div className="absolute left-0 bottom-0 w-full h-screen bg-black opacity-70 flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <h2 className="text-xl font-semibold">loading</h2>
              </div>
            )}
          <div className="flex items-center space-x-4">
            <button className={`${isSidebarOpen ? "hidden" : "block"}`} onClick={toggleSidebar}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 text-black">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
              </svg>
            </button>
            <button className={`${isSidebarOpen ? "block" : "hidden"}`} onClick={toggleSidebar}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 text-black">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
              </svg>
            </button>
            <h1 className="text-lg md:text-xl font-semibold text-blue-600">
              Quizzz
            </h1>
          </div>
          <div className="flex space-x-4 items-center">
            <div className="text-gray-600">
              <span className="font-medium">Time Left:</span>
              <span className="ml-2 text-blue-600">{`${Math.floor(
                timeLeft / 60
              )}:${(timeLeft % 60).toString().padStart(2, "0")}`}</span>
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 h-2 mt-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full"
                  style={{ width: `${(timeLeft / 3600) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="text-gray-600">
              <span className="font-medium">Question</span>
              <span className="ml-2 text-blue-600">
                {questions.length > 0
                  ? `${currentQuestionIndex + 1}/${questions.length}`
                  : "Loading..."}
              </span>
              {/* Progress Bar for Questions Answered */}
              <div className="w-full bg-gray-200 h-2 mt-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full"
                  style={{
                    width: `${
                      ((currentQuestionIndex + 1) / questions.length) * 100
                    }%`,
                  }}
                ></div>
              </div>
            </div>
            <button
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              onClick={() => {
                localStorage.removeItem("userName");
                localStorage.removeItem("quizAnswers");
                localStorage.removeItem("timeLeft");
                localStorage.removeItem("isQuizSubmitted");
                router.push('/');
              }}
            >
              Exit
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="mt-8 bg-white p-6 rounded-md shadow-md">
          {/* Submit Button in top-right of the content container */}
          <div className="flex justify-end mt-6">
            {currentQuestionIndex > 0 && (
              <button
                className="py-2 px-4 bg-gray-400 text-white rounded-md shadow-md hover:bg-gray-500 transition mr-2"
                onClick={handlePreviousQuestion}
              >
                Previous
              </button>
            )}

            {currentQuestionIndex < questions.length - 1 ? (
              <button
                className="py-2 px-4 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition"
                onClick={handleNextQuestion}
              >
                Next
              </button>
            ) : (
              !isQuizSubmitted && (
                <button
                  className="py-2 px-4 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition"
                  onClick={handleSubmit}
                >
                  Submit
                </button>
              )
            )}
          </div>

          {isUnansweredModalOpen && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <h2 className="text-lg font-bold mb-4 text-black">Warning</h2>
                <p className="text-gray-800 mb-4">
                  Cannot submit the quiz because there are unanswered questions
                </p>
                <ul className="list-disc list-inside mb-4 text-black/60">
                  {unansweredQuestionIndices.map((index) => (
                    <li key={index}>Question number {index}</li>
                  ))}
                </ul>
                <div className="flex justify-end">
                  <button
                    className="mr-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    onClick={() => {
                      setIsUnansweredModalOpen(false); // Tutup modal
                    }}
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}

          {isModalOpen && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <h2 className="text-lg font-bold mb-4">Konfirmasi</h2>
                <p className="text-gray-800 mb-4">
                  Apakah Anda yakin ingin menyelesaikan soal ini?
                </p>
                <div className="flex justify-end">
                  <button
                    className="mr-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                    onClick={() => setIsModalOpen(false)} // Tutup modal jika tidak yakin
                  >
                    Tidak
                  </button>
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    onClick={() => {
                      const score = Object.values(answers).filter(
                        (answer, index) => {
                          return answer === questions[index].correctAnswer;
                        }
                      ).length;

                      setFinalScore(score); // Simpan skor
                      setIsModalOpen(false); // Tutup modal konfirmasi
                      setIsScoreModalOpen(true); // Buka modal untuk menunjukkan skor
                    }}
                  >
                    Ya
                  </button>
                </div>
              </div>
            </div>
          )}

          {isScoreModalOpen && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <h2 className="text-lg font-bold mb-4">Skor Akhir</h2>
                <p className="text-gray-800 mb-4">
                  Skor Anda adalah: {finalScore} dari {questions.length}
                </p>
                <div className="flex justify-end">
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    onClick={() => setIsScoreModalOpen(false)} // Tutup modal skor
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Question and Answer Row */}
          <div className="flex flex-col md:flex-row gap-8">
            {/* Question Section */}
            <div className={`${isQuizSubmitted ? "md:w-1/3" : "md:w-1/2"}`}>
              <div className="text-lg md:text-xl font-medium text-gray-800 mb-4">
                Question {currentQuestionIndex + 1}
              </div>
              <p className="text-gray-800 font-semibold">
                {questions[currentQuestionIndex]?.question}
              </p>
            </div>

            {/* Options Section */}
            <div className={`${isQuizSubmitted ? "md:w-1/3" : "md:w-1/2"}`}>
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">
                Select only one answer
              </h2>
              <div className="space-y-4">
                {questions[currentQuestionIndex]?.options.map((option: any) => (
                  <label
                    key={option.value}
                    className={`flex items-center p-4 rounded-md cursor-pointer transition 
                  ${
                    isQuizSubmitted
                      ? // Setelah submit, tunjukkan warna hijau atau merah berdasarkan jawaban
                        option.label === questions[currentQuestionIndex].correctAnswer
                        ? "bg-green-200" // Hijau untuk jawaban benar
                        : answers[currentQuestionIndex] === option.label
                        ? "bg-red-200" // Merah untuk jawaban salah
                        : "bg-gray-100" // Default setelah submit
                      : // Sebelum submit, beri warna biru untuk opsi yang dipilih
                      answers[currentQuestionIndex] === option.label
                      ? "bg-blue-200" // Biru untuk opsi yang dipilih
                      : "bg-gray-100" // Default sebelum submit
                  }`}
                  >
                    <input
                      type="radio"
                      name="answer"
                      className="form-radio text-blue-600 h-5 w-5"
                      checked={answers[currentQuestionIndex] === option.label}
                      disabled={isQuizSubmitted}
                      onChange={() => handleAnswerSelect(option.label)}
                    />
                    <span className="ml-3 text-gray-700">{option.value}</span>{" "}
                    {/* Tampilkan nilai dari opsi */}
                  </label>
                ))}
              </div>
            </div>
            {isQuizSubmitted && (
              <div className="md:w-1/3 mt-8 md:mt-0">
                <h2 className="text-xl font-semibold mb-2">Your Answers:</h2>
                <ul className="space-y-4">
                  {questions.map((question, index) => {
                    const isCorrect = answers[index] === question.correctAnswer;

                    return (
                      <li key={index} className="p-4 border border-gray-300 rounded-lg">
                        <p className="font-semibold">{`Question ${index + 1}`}</p>
                        <p
                          className={`mt-2 ${
                            isCorrect ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          Your Answer: {answers[index] || "Not Answered"}
                        </p>
                        {!isCorrect && (
                          <p className="text-gray-600 mt-1">
                            Correct Answer: {question.correctAnswer}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-4">Your Score: {finalScore} out of {questions.length}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
