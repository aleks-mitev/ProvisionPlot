import { TouchableOpacity, Text } from 'react-native';

interface SubmitButtonProps {
  label: string;
  onPress: () => void;
}

export default function SubmitButton({ label, onPress }: SubmitButtonProps) {
  return (
    <TouchableOpacity 
      className="bg-primary rounded-xl py-4 items-center justify-center w-full"
      onPress={onPress}
    >
      <Text className="text-background text-lg font-bold">{label}</Text>
    </TouchableOpacity>
  );
}
