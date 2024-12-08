import { useEffect } from "react";
import LoadingScreen from "./common/LoadingScreen/LoadingScreen";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ProtectedRoute = ({
  children,
  fallback = (
    <div>
      <LoadingScreen />
    </div>
  ),
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, refreshToken } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const validatedAuth = async () => {
      if (!isLoading && !isAuthenticated) {
        console.log("Unauthenticated user redirected to home");
        router.replace("/");
      }
    };
    validatedAuth();
  }, [isAuthenticated, isLoading, refreshToken, router]);

  if (isLoading) {
    return fallback;
  }

  return isAuthenticated ? children : null;
};

export default ProtectedRoute;
