import React, { useEffect, useState } from "react";
import { api } from "@/app/lib/axios";
import Image from "next/image";
import Link from "next/link";
import LoadingScreen from "@/app/components/common/LoadingScreen/LoadingScreen";
import { Card, CardContent, CardHeader, CardTitle } from "../card/Card";

interface Accord {
  name: string;
  background_color?: string;
}

interface Product {
  id: number;
  name: string;
  accords: Accord[];
  brand: string;
  imageURL: string | null;
  matching_accords_count?: number;
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

const SeasonalRecommendations = () => {
  const [recommendations, setRecommendations] = useState<{
    season: string;
    recommendations: Product[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await api.get("/products/recommendations/seasonal");
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
  }, []);

  if (isLoading) return <LoadingScreen />;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;
  if (!recommendations?.recommendations?.length) {
    return (
      <div className="text-center p-4">
        No seasonal recommendations available
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {recommendations.season} Recommendations
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Fragrances perfectly suited for the current season
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {recommendations.recommendations.map((product) => (
            <Link
              key={product.id}
              href={`/products/${encodeURIComponent(product.name)}`}
              className="block"
            >
              <Card className="transition-all duration-200 hover:shadow-lg">
                <CardHeader className="p-3">
                  <CardTitle className="text-sm">{product.name}</CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {product.brand}
                  </p>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="relative w-full aspect-[3/4] mb-2">
                    {product.imageURL ? (
                      <Image
                        src={product.imageURL}
                        alt={product.name}
                        fill
                        className="rounded-md object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.style.display = "none";
                          target.parentElement?.classList.add("error-state");
                        }}
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {product.accords.slice(0, 3).map((accord, index) => (
                      <span
                        key={index}
                        className="px-1.5 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700"
                      >
                        {accord.name}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SeasonalRecommendations;
