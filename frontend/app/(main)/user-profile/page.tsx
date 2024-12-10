"use client";
import React from "react";
import { useAuth } from "@/app/components/auth/AuthContext";
import { Camera, Heart, Star, Box, Plus, Flower } from "lucide-react";
import LoadingScreen from "@/app/components/common/LoadingScreen/LoadingScreen";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import { AccordBadge } from "@/app/components/ui/AccordBadge/AccordBadge";

const EmptyStateCard = ({
  icon: Icon,
  title,
  message,
}: {
  icon: React.ElementType;
  title: string;
  message: string;
}) => (
  <div className="flex flex-col items-center justify-center h-40 text-center">
    <Icon className="w-8 h-8 mb-2 text-gray-400" />
    <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
    <p className="text-xs text-gray-500">{message}</p>
    <button className="mt-3 flex items-center text-sm text-blue-500 hover:text-blue-600 transition-colors">
      <Plus className="w-4 h-4 mr-1" />
    </button>
  </div>
);

const UserProfile = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen></LoadingScreen>;
  }

  if (!user) {
    return (
      <div className="text-center p-4 bg-white rounded-lg shadow-lg">
        <p className="text-gray-600">Could not load the profile</p>
      </div>
    );
  }
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8 transform hover:scale-102 transition-transform duration-300">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </div>
                <div className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow-lg">
                  <Camera size={16} className="text-gray-600" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-800">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="text-gray-600">@{user.userName}</p>
                <p className="text-gray-500 mt-1">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Favorite Accords */}
            <div className="bg-white rounded-lg shadow-lg p-6 transform hover:translate-y-1 transition-all duration-300">
              <div className="flex items-center mb-4 text-purple-600">
                <Flower className="mr-2" />
                <h2 className="text-lg font-semibold">Accords</h2>
              </div>
              {user.favorite_accords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.favorite_accords.map((accord, index) => (
                    <AccordBadge
                      key={index}
                      name={accord}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    />
                  ))}
                </div>
              ) : (
                <EmptyStateCard
                  icon={Heart}
                  title="Favorite Accords"
                  message="Discover and add your favorite scent accords"
                />
              )}
            </div>

            {/* Favorite Collections */}
            <div className="bg-white rounded-lg shadow-lg p-6 transform hover:translate-y-1 transition-all duration-300">
              <div className="flex items-center mb-4 text-blue-600">
                <Star className="mr-2" />
                <h2 className="text-lg font-semibold">I had it</h2>
              </div>
              {user.favorite_collections.length > 0 ? (
                <div className="space-y-2">
                  {user.favorite_collections.map((collection, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 bg-blue-50 rounded-md text-blue-700 animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {collection}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyStateCard
                  icon={Star}
                  title="Collections"
                  message="Create and curate your personal scent collections"
                />
              )}
            </div>

            {/* Favorite Products */}
            <div className="bg-white rounded-lg shadow-lg p-6 transform hover:translate-y-1 transition-all duration-300">
              <div className="flex items-center mb-4 text-teal-600">
                <Heart className="mr-2" />
                <h2 className="text-lg font-semibold">I want it</h2>
              </div>
              {user.favorite_products.length > 0 ? (
                <div className="space-y-2">
                  {user.favorite_products.map((product, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 bg-teal-50 rounded-md text-teal-700 animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {product}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyStateCard
                  icon={Box}
                  title="Products"
                  message="Save your favorite fragrance products"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default UserProfile;
