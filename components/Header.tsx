import type { SessionUser } from "@/services/authApi";
import { Image } from "expo-image";
import {
  ImageSourcePropType,
  Image as RNImage,
  Text,
  View,
} from "react-native";

interface HeaderProps {
  title: string;
  date: string;
  user: SessionUser;
  chevronIcon?: ImageSourcePropType;
}

export default function Header({
  title,
  date,
  user,
  chevronIcon,
}: HeaderProps) {
  return (
    <View className="flex-row items-center justify-between bg-cream px-6 py-4 border-b border-slate-200">
      <Text className="text-xl font-semibold text-slate-800">{title}</Text>
      <View className="flex-row items-center">
        <Text className="text-slate-600 mr-4">{date}</Text>
        <View className="w-px h-5 bg-slate-300 mr-4" />
        {user.avatar ? (
          <Image
            source={user.avatar}
            style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }}
            contentFit="cover"
          />
        ) : (
          // A real employee might not have a photo on file
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              marginRight: 8,
              backgroundColor: "#E2E8F0",
            }}
          />
        )}
        <Text className="text-slate-800 mr-1" numberOfLines={1}>
          {user.employeeId}
        </Text>
        {chevronIcon && (
          <RNImage
            source={chevronIcon}
            style={{ width: 12, height: 12 }}
            resizeMode="contain"
          />
        )}
      </View>
    </View>
  );
}
