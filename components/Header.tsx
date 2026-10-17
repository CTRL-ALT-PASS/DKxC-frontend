import { useAuth } from "@/context/AuthContext";
import { Text, View } from "react-native";

interface HeaderProps {
  title: string;
  date: string;
}

export default function Header({ title, date }: HeaderProps) {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return null;
  }

  return (
    <View className="flex-row items-center justify-between bg-cream px-6 py-4 border-b border-slate-200">
      <Text className="text-xl font-semibold text-slate-800">{title}</Text>

      <View className="flex-row items-center">
        <Text className="text-slate-800 mr-4">{date}</Text>
        <View className="w-px h-5 bg-slate-800 mr-4" />

        <Text className="text-slate-800 mr-1" numberOfLines={1}>
          {user.fullname}
        </Text>
      </View>
    </View>
  );
}
