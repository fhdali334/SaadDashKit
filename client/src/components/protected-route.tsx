import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { checkSession } from "@/lib/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Track recent login attempts to prevent immediate kickout
const RECENT_LOGIN_GRACE_PERIOD = 2000; // 2 seconds grace period after login
let lastLoginTime = 0;

export function setLastLoginTime() {
  lastLoginTime = Date.now();
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    const verifySession = async () => {
      const timeSinceLogin = Date.now() - lastLoginTime;
      const isInGracePeriod = timeSinceLogin < RECENT_LOGIN_GRACE_PERIOD;
      
      const session = await checkSession();
      
      if (!session.authenticated) {
        // If we're in the grace period after login, retry instead of immediately kicking out
        if (isInGracePeriod && retryCountRef.current < maxRetries) {
          retryCountRef.current += 1;
          await new Promise(resolve => setTimeout(resolve, 300));
          return verifySession(); // Retry
        }
        
        setLocation("/login");
      } else {
        setIsAuth(true);
      }
      setIsChecking(false);
    };

    verifySession();
  }, [setLocation]);

  if (isChecking || !isAuth) {
    return null;
  }

  return <>{children}</>;
}
