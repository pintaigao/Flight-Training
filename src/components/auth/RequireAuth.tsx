import { Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useStore } from "@/store/store";

const bypass =
  import.meta.env.DEV && import.meta.env.VITE_BYPASS_AUTH === "true";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { state, dispatch } = useStore();
  const location = useLocation();
  
  useEffect(() => {
    if (!bypass) return;
    if (state.auth.user) return;
    
    dispatch({
      type: "AUTH_SET_USER",
      payload: { id: "dev", email: import.meta.env.VITE_DEV_USER_EMAIL || "dev@local"},
    });
  }, [dispatch, state.auth.user]);
  
  // dev bypass：等注入完成就放行；还没注入就先别跳转
  if (bypass) return <>{children}</>;
  
  // 正常逻辑
  if (state.auth.status === "checking") return null;
  if (!state.auth.user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <>{children}</>;
}