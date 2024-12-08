"use client";
import React from "react";
import { useAuth } from "../../auth/AuthContext";

interface AccordMatchPercentProps {
  productAccords: Array<{ name: string; background_color: string }>;
}

const AccordMatchPercent: React.FC<AccordMatchPercentProps> = ({
  productAccords,
}) => {
  const { user } = useAuth();

  const normalizeAccordName = (name: string): string => {
    return name.toLowerCase().trim();
  };

  const calculateMatchPercentage = () => {
    if (
      !user?.favorite_accords ||
      user.favorite_accords.length === 0 ||
      productAccords.length === 0
    ) {
      return 0;
    }

    // Normalize user accords
    const normalizedUserAccords =
      user.favorite_accords.map(normalizeAccordName);

    // Count matching accords using normalized names
    const matchingAccords = productAccords.filter((accord) =>
      normalizedUserAccords.includes(normalizeAccordName(accord.name)),
    ).length;

    return Math.round((matchingAccords / productAccords.length) * 100);
  };

  const matchPercentage = calculateMatchPercentage();

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Scent Match</h3>
      <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
          style={{
            width: `${matchPercentage}%`,
            backgroundColor: getMatchColor(matchPercentage),
          }}
        />
      </div>
      <div className="mt-2 text-center font-medium">
        {matchPercentage}% Match with Your Preferences
      </div>
      {/* Optional: Add a breakdown of matching accords */}
      <div className="mt-2 text-sm text-gray-600">
        {productAccords
          .filter((accord) =>
            user?.favorite_accords
              ?.map(normalizeAccordName)
              .includes(normalizeAccordName(accord.name)),
          )
          .map((accord) => (
            <span
              key={accord.name}
              className="inline-block px-2 py-1 m-1 rounded-full text-xs"
              style={{
                backgroundColor: accord.background_color,
                color: isLightColor(accord.background_color)
                  ? "black"
                  : "white",
              }}
            >
              {accord.name}
            </span>
          ))}
      </div>
    </div>
  );
};

// Helper function to determine the color based on match percentage
const getMatchColor = (percentage: number): string => {
  if (percentage >= 80) return "#22c55e"; // green-500
  if (percentage >= 60) return "#84cc16"; // lime-500
  if (percentage >= 40) return "#eab308"; // yellow-500
  if (percentage >= 20) return "#f97316"; // orange-500
  return "#ef4444"; // red-500
};

// Helper function to determine if a color is light
const isLightColor = (color: string): boolean => {
  const hex = color.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
};

export default AccordMatchPercent;
