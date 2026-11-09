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
    <View className="flex-row items-center justify-between bg-neutral px-6 py-4 border-b border-tertiary-soft/40">
      <Text className="text-xl font-semibold text-secondary">{title}</Text>

      <View className="flex-row items-center">
        <Text className="text-secondary/70 mr-4">{date}</Text>
        <View className="w-px h-5 bg-tertiary-soft mr-4" />

        <View className="w-2 h-2 rounded-full bg-success mr-2" />
        <Text className="text-secondary font-medium" numberOfLines={1}>
          {user.fullname}
        </Text>
      </View>
    </View>
  );
}