"use client";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import QuizModal from "@/app/components/quiz/QuizModal";
import React, { useState } from "react";

export default function QuizPage() {
  const [isModalOpen, setModalOpen] = useState(false);

  // Example quiz/survey questions
  const questions = [
    {
      question: "What is your ideal vacation?",
      options: [
        "Relaxing on a secluded tropical island",
        "Skiing in the snowy mountains",
        "Exploring a bustling city like New York",
        "Strolling through romantic Paris streets",
      ],
    },
    {
      question: "Which season brings out your best self?",
      options: [
        "Spring, when everything blooms",
        "Summer, with endless sunny days",
        "Fall, with cozy vibes and colorful leaves",
        "Winter, when it is all about warmth and hot cocoa",
      ],
    },
    {
      question: "What is your favorite weekend activity?",
      options: [
        "Hiking in the mountains or by the beach",
        "Going to a live concert or music festival",
        "Treating yourself to a spa day",
        "Exploring new cafes or hidden spots in the city",
      ],
    },
    {
      question: "What is your favorite time of day?",
      options: [
        "Sunrise, when the world feels fresh and quiet",
        "Mid-afternoon, when the sun is warm but not too hot",
        "Early evening, just before the stars come out",
        "Late at night, when everything feels calm",
      ],
    },
    {
      question: "Which type of movie would you choose for a night in?",
      options: [
        "Action-packed superhero adventure",
        "A lighthearted romantic comedy",
        "A mystery that keeps you on the edge of your seat",
        "A fantasy with magical creatures and faraway lands",
      ],
    },
    {
      question: "What kind of music is always on your playlist?",
      options: [
        "Upbeat pop that makes you dance",
        "Classic rock with guitar riffs",
        "Soothing classical music",
        "Jazzy tunes with a laid-back vibe",
      ],
    },
    {
      question: "What is your favorite type of food?",
      options: [
        "A classic Italian pasta dish",
        "Spicy and flavorful Mexican food",
        "French pastries and delicate desserts",
        "Fresh and simple Japanese cuisine",
      ],
    },
    {
      question: "How do you like to unwind after a long day?",
      options: [
        "Reading a book in a cozy nook",
        "Watching your favorite series with a snack",
        "Meditating or practicing yoga",
        "Cooking up a new recipe",
      ],
    },
    {
      question: "What is your favorite drink to relax with?",
      options: [
        "A freshly brewed cup of coffee",
        "A calming cup of herbal tea",
        "A glass of rich red wine",
        "A refreshing mojito cocktail",
      ],
    },
    {
      question: "What is your ideal pet?",
      options: [
        "A loyal and playful dog",
        "An independent and mysterious cat",
        "A colorful bird that sings all day",
        "A calm fish that swims gracefully",
      ],
    },
  ];

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-200 p-4">
        <h1 className="text-4xl font-bold mb-8">Parfummelier</h1>
        <button
          onClick={openModal}
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-500"
        >
          Start Quiz
        </button>

        {/* Render the QuizModal */}
        <QuizModal
          isOpen={isModalOpen}
          onClose={closeModal}
          questions={questions}
        />

        {/* Portal Target */}
        <div id="portal"></div>
      </div>
    </ProtectedRoute>
  );
}
