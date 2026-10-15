import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  getCurrentEmployee,
  login as loginRequest,
  type AuthUser,
} from "../services/authApi";

import {
  clearAuthToken,
  getAuthToken,
  saveAuthToken,
} from "../services/authStorage";

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  sessionError: string | null;
  signIn: (employeeId: string, pinCode: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  retrySessionRestore: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const restoreSession = useCallback(async () => {
    setIsLoading(true);
    setSessionError(null);

    try {
      const token = await getAuthToken();

      if (!token) {
        setUser(null);
        return;
      }

      const employee = await getCurrentEmployee(token);
      setUser(employee);
    } catch (error) {
      if (error instanceof Error && error.message === "SESSION_INVALID") {
        // Only clear the token when Laravel rejects it.
        try {
          await clearAuthToken();
        } catch (storageError) {
          console.error("Failed to clear invalid token:", storageError);
        }

        setUser(null);
        return;
      }

      // Keep the saved token if this may be a network/server issue.
      console.error("Session restoration failed:", error);
      setUser(null);
      setSessionError(
        "Unable to verify your session. Check your connection and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  const signIn = useCallback(async (employeeId: string, pinCode: string) => {
    const result = await loginRequest(employeeId, pinCode);

    await saveAuthToken(result.token);
    setUser(result.employee);
    setSessionError(null);

    return result.employee;
  }, []);

  const signOut = useCallback(async () => {
    await clearAuthToken();
    setUser(null);
    setSessionError(null);
  }, []);

  const retrySessionRestore = useCallback(async () => {
    await restoreSession();
  }, [restoreSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        sessionError,
        signIn,
        signOut,
        retrySessionRestore,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }

  return context;
}
