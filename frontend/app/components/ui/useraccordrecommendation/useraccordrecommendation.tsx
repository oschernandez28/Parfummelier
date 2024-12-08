import React, { useState, useEffect } from "react";
import { api } from "@/app/lib/axios";
import Link from "next/link";
import { useAuth } from "@/app/components/auth/AuthContext";
import LoadingScreen from "@/app/components/common/LoadingScreen/LoadingScreen";
import ProductCarousel from "./ProductCarousel";

interface Accord {
  name: string;
  background_color: string;
}

interface Product {
  id: number;
  name: string;
  accords: string[];
  brand: string;
  imageURL: string | null;
  match_ratio: number;
}

interface RecommendationResponse {
  recommendations: Product[];
  total_matches: number;
}

const getImageUrl = (url: string | null) => {
  if (!url) return null;
  try {
    const fixedUrl = url.replace("/images", "/images/");
    const imageUrl = new URL(fixedUrl);

    if (process.env.NODE_ENV === "development") {
      imageUrl.hostname = "localhost";
      imageUrl.port = "8000";
    }
    return imageUrl.toString();
  } catch (error) {
    console.error("Error processing image URL:", error);
    return url;
  }
};

const UserAccordRecommendation = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] =
    useState<RecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user?.favorite_accords?.length) {
        setError(
          "No favorite accords found. Take the quiz to get personalized recommendations",
        );
        setIsLoading(false);
        return;
      }

      try {
        // Remove the nested data object
        const response = await api.post("/products/recommendation-by-accord", {
          accordbank: user.favorite_accords,
        });

        const transformedData = {
          ...response.data,
          recommendations: response.data.recommendations.map(
            (product: Product) => ({
              ...product,
              imageURL: getImageUrl(product.imageURL),
            }),
          ),
        };
        setRecommendations(transformedData);
      } catch (err) {
        console.error("Error details:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch recommendations",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [user?.favorite_accords]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Personal Recommendations
            </h2>
            <p className="text-red-500">{error}</p>
            <Link
              href="/quiz"
              className="mt-4 inline-block text-blue-600 hover:text-blue-800"
            >
              Take the Quiz
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!recommendations?.recommendations?.length) {
    return (
      <div className="text-center p-4">
        No personalized recommendations available at this time
      </div>
    );
  }

  return <ProductCarousel recommendations={recommendations.recommendations} />;
};

export default UserAccordRecommendation;
