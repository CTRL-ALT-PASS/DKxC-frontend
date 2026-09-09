import { View, Text, Image as RNImage, ImageSourcePropType } from "react-native";
import { Image } from "expo-image";
import type { User } from "../constants/mockData";

interface HeaderProps {
  title: string;
  date: string;
  user: User;
  chevronIcon?: ImageSourcePropType;
}

export default function Header({ title, date, user, chevronIcon }: HeaderProps) {
  return (
    <View className="flex-row items-center justify-between bg-cream px-6 py-4 border-b border-slate-200">
      <Text className="text-xl font-semibold text-slate-800">{title}</Text>
      <View className="flex-row items-center">
        <Text className="text-slate-600 mr-4">{date}</Text>
        <View className="w-px h-5 bg-slate-300 mr-4" />
        <Image
          source={user.avatar}
          style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }}
          contentFit="cover"
        />
        <Text className="text-slate-800 mr-1">{user.name}</Text>
        {chevronIcon && <RNImage source={chevronIcon} style={{ width: 12, height: 12 }} resizeMode="contain" />}
      </View>
    </View>
  );
}
