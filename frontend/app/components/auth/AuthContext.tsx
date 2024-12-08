"use client";
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthState } from "../../type/auth";
import axios from "axios";

interface AuthContextProps extends AuthState {
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AUTH_TIMES = {
  REFRESH_INTERVAL: 8 * 60 * 60 * 1000,
} as const;

// NOTE: Create a context object
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Set state of the user authentication
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const router = useRouter();
  const pathname = usePathname();

  //NOTE: logout context
  const logout = useCallback(async () => {
    try {
      await axios.post("/api/logout");
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      router.push("/");
    } catch (error) {
      console.error("error logging out : ", error);
    }
  }, [router]);

  // NOTE: Refresh token function
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      // refresh token will be automatically included in the request
      // as an HTTP-only cookie because the endpoint matches the cookie's path
      const response = await axios.post(
        "http://localhost:8000/auth/refresh",
        {}, // empty body since there is no payload
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
          validateStatus: (status) => status === 200 || status === 401,
        },
      );

      if (response.status === 200) {
        const { access_token } = response.data;
        await axios.post("/api/setAccessToken", { access_token });

        // update user state if needed
        const userResponse = await axios.get(
          "http://localhost:8000/user/current-user/info",
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
            validateStatus: (status) => status === 200 || status === 401,
          },
        );

        if (userResponse.status === 200) {
          setState((prev) => ({
            ...prev,
            user: userResponse.data,
            isAuthenticated: true,
          }));
        }

        return true;
      }
      return false;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status !== 401) {
        console.error("Unexpected error during token refresh:", error);
      }
      return false;
    }
  }, []);

  // NOTE: Authentication Status Checker
  const checkAuth = useCallback(async () => {
    try {
      console.log("Starting Auth Check");
      const tokenResponse = await axios.get("/api/getAccessToken");
      const access_token = tokenResponse.data?.access_token;

      // if the token is expired or non exist
      // checkAuth will attemp to request a new one
      if (!access_token) {
        const refreshed = await refreshToken();
        if (!refreshed) {
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
        return;
      } else {
        //NOTE: trying using existing token
        try {
          const userResponse = await axios.get(
            "http://localhost:8000/user/current-user/info",
            {
              headers: {
                Authorization: `Bearer ${access_token}`,
              },
            },
          );
          if (userResponse.status === 200) {
            // Update state with new data
            setState((prevState) => ({
              ...prevState,
              user: userResponse.data,
              isAuthenticated: true,
              isLoading: false,
            }));
          }
        } catch (userError) {
          if (axios.isAxiosError(userError)) {
            if (userError.response?.status === 404) {
              console.error("User's scentbank not found");
              setState((prevState) => ({
                ...prevState,
                user: null,
                isAuthenticated: false,
                isLoading: false,
              }));
            } else if (userError.response?.status === 401) {
              const refreshed = await refreshToken();
              if (!refreshed) {
                setState({
                  user: null,
                  isAuthenticated: false,
                  isLoading: false,
                });
              }
            }
          }
        }
      }
    } catch (error: any) {
      // Return error
      console.error("Auth Check Error:", {
        status: error.reponse?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });
      const refreshed = await refreshToken();
      if (!refreshed) {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    }
  }, [refreshToken]);

  // NOTE: login function
  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(
        "http://localhost:8000/auth/login",
        {
          email,
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        },
      );

      if (response.status === 200) {
        const { access_token } = response.data;
        await axios.post("/api/setAccessToken", { access_token });
        router.push("/main");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log("Request Config:", error.config);
        console.log("Response Headers:", error.response?.headers);
        throw new Error(
          error.response?.data?.error || "An error occured while logging in",
        );
      }
      throw new Error("An error occured");
    }
  };

  const refreshUserData = async () => {
    try {
      const tokenResponse = await axios.get("/api/getAccessToken");
      const access_token = tokenResponse.data?.access_token;

      if (access_token) {
        const userResponse = await axios.get(
          "http://localhost:8000/user/current-user/info",
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          },
        );

        if (userResponse.status === 200) {
          setState((prev) => ({
            ...prev,
            user: userResponse.data,
          }));
        }
      }
    } catch (error) {
      console.error("Error refreshing user data: ", error);
    }
  };

  // Initialize the auth state on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth, pathname]);

  // set up token refresh interval when authenticated
  useEffect(() => {
    if (state.isAuthenticated) {
      const refreshInterval = setInterval(async () => {
        const refreshed = await refreshToken();
        if (!refreshed) {
          logout();
        }
      }, AUTH_TIMES.REFRESH_INTERVAL);
      return () => clearInterval(refreshInterval);
    }
  }, [state.isAuthenticated, logout, refreshToken]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        refreshToken,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// NOTE: Wrap the Object Context with useAuth call sign
// so this file can be called from anywhere in the project
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("UseAuth must be used with as AuthProvider");
  }
  return context;
};
