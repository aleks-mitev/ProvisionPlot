import { View, Text } from 'react-native';

interface MacroTotalsDisplayProps {
  calories: number | string;
  protein: number | string;
}

export default function MacroTotalsDisplay({ calories, protein }: MacroTotalsDisplayProps) {
  return (
    <View className="bg-primary/10 border border-primary/30 rounded-lg py-4 px-6 mt-4 mb-4 flex-row justify-around">
      <Text className="text-primary text-2xl font-bold">
        {Math.round(Number(calories))} <Text className="text-sm font-normal">cal</Text>
      </Text>
      <Text className="text-primary text-2xl font-bold">
        {Number(protein).toFixed(1)}g <Text className="text-sm font-normal">protein</Text>
      </Text>
    </View>
  );
}
