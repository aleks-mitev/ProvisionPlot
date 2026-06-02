import { View, Text } from 'react-native';

interface SectionDividerProps {
  label: string;
}

export default function SectionDivider({ label }: SectionDividerProps) {
  return (
    <View className="flex-row items-center w-full my-4">
      <View className="flex-1 h-[1px] bg-border" />
      <Text className="text-secondary/50 text-xs font-bold uppercase tracking-widest mx-4">
        {label}
      </Text>
      <View className="flex-1 h-[1px] bg-border" />
    </View>
  );
}
