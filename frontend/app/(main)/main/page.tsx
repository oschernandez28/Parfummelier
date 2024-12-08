"use client";
import { useAuth } from "@/app/components/auth/AuthContext";
import HowitWorkHero from "@/app/components/layout/HowItWorksHero";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import QuizPromptSection from "@/app/components/quiz/QuizPromptSection";
import Content from "@/app/components/ui/content/Content";
import SeasonalRecommendations from "@/app/components/ui/seasonalrecomendation/seasonalrecommendation";
import UserAccordRecommendation from "@/app/components/ui/useraccordrecommendation/useraccordrecommendation";
import React from "react";

export default function Main() {
  const { user } = useAuth();

  const isNewUser =
    !user?.favorite_accords || user.favorite_accords.length === 0;

  return (
    <ProtectedRoute>
      <div>
        <Content>
          <h1>
            Welcome , {user?.firstName} {user?.lastName}
          </h1>
        </Content>
        <HowitWorkHero />
        {/* NOTE: Quiz prompt section */}
        {/* NOTE: Recommendation by user's accord, we need to find a way to connect */}
        {/* the user's answer to the user's context for the update product */}
        <UserAccordRecommendation />

        {/* NOTE: Recommendation by Season */}
        <SeasonalRecommendations />

        <QuizPromptSection isNewUser={isNewUser}></QuizPromptSection>
      </div>
    </ProtectedRoute>
  );
}
