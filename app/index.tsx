import { Redirect } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null; // layout already shows the spinner

  if (!user) return <Redirect href="/login" />;

  const isManager = user.role?.toLowerCase() === "manager";
  return <Redirect href={isManager ? "/(inventory)/dashboards" : "/(pos)/menu"} />;
}