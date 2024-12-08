/*
    The QuizModal component is a React modal used to display a quiz or survey to users.
    Log to console an array/list of answers in variable updatedAnswers
*/
"use client";
import React, { useState } from "react";
import ReactDOM from "react-dom";
import axios from "axios";

interface QuizModalProps {
  isOpen: boolean;

  onClose: () => void;

  questions: { question: string; options: string[] }[];
}

const QuizModal: React.FC<QuizModalProps> = ({
  isOpen,
  onClose,
  questions,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>(
    Array(questions.length).fill(null),
  );
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = questions[currentQuestionIndex];

  // Store the selected option (string value)
  const handleOptionClick = (optionValue: string) => {
    setSelectedOption(optionValue);
  };

  const submitQuizAnswers = async (answers: string[]) => {
    try {
      // Get access token
      const tokenResponse = await axios.get("/api/getAccessToken");
      const { access_token } = tokenResponse.data;

      // Submit quiz answers
      const response = await axios.post(
        "http://localhost:8000/quiz/submit-quiz",
        {
          answers: answers,
        },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.status === 201) {
        // Success handling
        console.log("Quiz submitted successfully:", response.data);
        onClose();
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      setError("Failed to submit quiz. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = async () => {
    if (selectedOption !== null) {
      const updatedAnswers = [...answers];
      updatedAnswers[currentQuestionIndex] = selectedOption;
      setAnswers(updatedAnswers);

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedOption(null);
      } else {
        // Quiz completed - submit answers
        setIsSubmitting(true);
        setError(null);

        // Filter out any null values and submit
        const validAnswers = updatedAnswers.filter(
          (answer): answer is string => answer !== null,
        );
        if (validAnswers.length === questions.length) {
          await submitQuizAnswers(validAnswers);
        }

        // Reset state
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
      }
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
        <h2 className="text-2xl font-bold mb-4">
          Question {currentQuestionIndex + 1}
        </h2>
        <p className="font-bold mb-4">{currentQuestion.question}</p>
        <div className="space-y-4">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionClick(option)}
              className={`block w-full text-left p-2 rounded-md ${
                selectedOption === option
                  ? "bg-blue-200"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        {error && <div className="mt-4 text-red-500 text-sm">{error}</div>}
        <div className="mt-6 text-right">
          <button
            onClick={handleNextQuestion}
            disabled={selectedOption === null || isSubmitting}
            className={`${
              selectedOption === null || isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500"
            } text-white py-2 px-4 rounded-md`}
          >
            {isSubmitting
              ? "Submitting..."
              : currentQuestionIndex < questions.length - 1
                ? "Next Question"
                : "Submit"}
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("portal")!,
  );
};

export default QuizModal;
