import React, { useState, useEffect } from "react";
import { Heart, LucideIcon, Star } from "lucide-react";
import axios from "axios";
import { useAuth } from "../../auth/AuthContext";

interface FavoriteButtonProps {
  icon: LucideIcon;
  isActive: boolean;
  isLoading: boolean;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const FavoriteButton = ({
  icon: Icon,
  isActive,
  isLoading,
  label,
  onClick,
  disabled,
}: FavoriteButtonProps) => (
  <button
    className={`
      flex flex-col items-center gap-1 p-3
      transition-all duration-200
      hover:scale-105 active:scale-95
      disabled:opacity-50 disabled:cursor-not-allowed
      ${isActive ? "text-pink-500" : "text-gray-500"}
    `}
    onClick={onClick}
    disabled={disabled || isLoading}
  >
    {isLoading ? (
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-current" />
    ) : (
      <Icon
        size={24}
        fill={isActive ? "currentColor" : "none"}
        className="transition-colors duration-200"
      />
    )}
    <span className="text-sm font-medium">{label}</span>
  </button>
);

interface Product {
  id: number;
  name: string;
  brand: string;
}

interface ProductActionsProps {
  product: Product;
}

interface ToggleType {
  (type: "favorite" | "collection"): Promise<void>;
}

export default function ProductActions({ product }: ProductActionsProps) {
  const [favorite, setFavorite] = useState(false);
  const [inCollection, setInCollection] = useState(false);
  const [isUpdatingFavorite, setIsUpdatingFavorite] = useState(false);
  const [isUpdatingCollection, setIsUpdatingCollection] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, refreshUserData } = useAuth();

  useEffect(() => {
    if (user && product) {
      setFavorite(user.favorite_products.includes(product.name));
      setInCollection(user.favorite_collections?.includes(product.name));
    }
  }, [user, product]);

  const handleToggle: ToggleType = async (type) => {
    if (!product) return;
    const isCollection = type === "collection";
    const setLoading = isCollection
      ? setIsUpdatingCollection
      : setIsUpdatingFavorite;
    const setState = isCollection ? setInCollection : setFavorite;
    const currentState = isCollection ? inCollection : favorite;

    setLoading(true);
    setError(null);

    try {
      const tokenResponse = await axios.get("/api/getAccessToken");
      const accessToken = tokenResponse.data.access_token;
      if (!accessToken) throw new Error("No access token available");

      const endpoint = isCollection
        ? "http://localhost:8000/user/scentbank/collections"
        : "http://localhost:8000/user/scentbank/products";

      const response = await axios.put(
        endpoint,
        {
          favorite_product_name: product.name,
          action: currentState ? "remove" : "add",
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.status === 200) {
        setState((prev) => !prev);
        await refreshUserData();
      }
    } catch (error: any) {
      // Type error as any for better error handling
      console.error(`Error updating ${type} status:`, error);
      setError(error.response?.data.error || `Failed to update ${type} status`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 justify-start">
        <FavoriteButton
          icon={Heart}
          isActive={favorite}
          isLoading={isUpdatingFavorite}
          label="I want it"
          onClick={() => handleToggle("favorite")}
        />
        <FavoriteButton
          icon={Star}
          isActive={inCollection}
          isLoading={isUpdatingCollection}
          label="I had it"
          onClick={() => handleToggle("collection")}
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
