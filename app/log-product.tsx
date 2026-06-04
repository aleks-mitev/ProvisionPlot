import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Trash2 } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDailyLogStore } from '../store/dailyLogStore';
import { getProductById, Product } from '../db/products';
import SectionDivider from '../components/SectionDivider';
import MacroTotalsDisplay from '@/components/MacroTotalsDisplay';
import SubmitButton from '@/components/SubmitButton';

export default function LogProductScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, log_id, initial_grams } = useLocalSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [grams, setGrams] = useState(initial_grams ? Number(initial_grams) : 100);
  const { addLogEntry, updateLogEntry, removeLogEntry } = useDailyLogStore();

  useEffect(() => {
    if (id) {
      const fetchedProduct = getProductById(Number(id));
      setProduct(fetchedProduct);
    }
  }, [id]);

  if (!product) return null;

  const liveCalories = Math.round((product.calories / 100) * grams);
  const liveProtein = Number(((product.protein / 100) * grams).toFixed(1));

  const handleLog = async () => {
    if (log_id) {
      await updateLogEntry(Number(log_id), grams, liveCalories, liveProtein);
    } else {
      await addLogEntry({
        reference_id: Number(id),
        type: 'product',
        grams_consumed: grams,
        calculated_calories: liveCalories,
        calculated_protein: liveProtein,
        name: product.name
      });
    }
    if (router.canDismiss()) {
      router.dismissAll();
    }
    setTimeout(() => {
      router.navigate('/(tabs)/daily-log');
    }, 100);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-4 pb-4 border-b border-border mb-6">
          <TouchableOpacity onPress={() => router.back()} className="w-10">
            <ArrowLeft color="#cacbaf" size={28} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-secondary flex-1 text-center">
            {log_id ? "Edit Logged Product" : "Log Product"}
          </Text>
          <View className="w-10 items-end">
            {log_id && (
              <TouchableOpacity
                onPress={async () => {
                  await removeLogEntry(Number(log_id));
                  if (router.canDismiss()) {
                    router.dismissAll();
                  }
                  setTimeout(() => {
                    router.navigate('/(tabs)/daily-log');
                  }, 100);
                }}
              >
                <Trash2 color="#ef4444" size={24} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Product Name */}
        <Text className="text-2xl font-bold text-secondary text-center mb-8">
          {product.name}
        </Text>

        {/* The Grams Input & Quick Adjusters (Fixed Spacing) */}
        <View className="flex-row items-center justify-between px-4 mb-10 w-full">
          {/* Left side (Minus buttons) */}
          <View className="flex-row gap-x-1.5">
            <TouchableOpacity onPress={() => setGrams(prev => Math.max(0, prev - 25))}>
              <View className="w-10 h-10 rounded-full bg-border items-center justify-center">
                <Text className="text-secondary text-base font-bold">-25</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setGrams(prev => Math.max(0, prev - 5))}>
              <View className="w-10 h-10 rounded-full bg-border items-center justify-center">
                <Text className="text-secondary text-base font-bold">-5</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setGrams(prev => Math.max(0, prev - 1))}>
              <View className="w-10 h-10 rounded-full bg-border items-center justify-center">
                <Text className="text-secondary text-base font-bold">-1</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Center (The Interactive Input) */}
          <View className="flex-row items-end justify-center min-w-[85px] mx-1">
            <TextInput
              value={String(grams)}
              onChangeText={(text) => {
                const cleanText = text.replace(/^0+(?=\d)/, '');
                const numericValue = parseInt(cleanText.replace(/[^0-9]/g, ''), 10);
                setGrams(isNaN(numericValue) ? 0 : numericValue);
              }}
              keyboardType="numeric"
              maxLength={4}
              className="text-4xl text-primary font-bold text-center p-0 m-0"
              style={{ includeFontPadding: false }}
            />
            <Text className="text-primary text-2xl font-bold mb-1 ml-0.5">g</Text>
          </View>

          {/* Right side (Plus buttons) */}
          <View className="flex-row gap-x-1.5">
            <TouchableOpacity onPress={() => setGrams(prev => prev + 1)}>
              <View className="w-10 h-10 rounded-full bg-border items-center justify-center">
                <Text className="text-secondary text-base font-bold">+1</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setGrams(prev => prev + 5)}>
              <View className="w-10 h-10 rounded-full bg-border items-center justify-center">
                <Text className="text-secondary text-base font-bold">+5</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setGrams(prev => prev + 25)}>
              <View className="w-10 h-10 rounded-full bg-border items-center justify-center">
                <Text className="text-secondary text-base font-bold">+25</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Math Preview */}
        <MacroTotalsDisplay calories={liveCalories} protein={liveProtein} />

        {/* Centered Label + Divider */}
        <SectionDivider label="PER 100G VALUES" />

        {/* Base Data Grid */}
        <View className="px-4 flex-row flex-wrap justify-between">
          {/* Calories */}
          <View className="w-[45%] mb-4">
            <Text className="text-secondary/70 text-xs mb-1">Calories</Text>
            <View className="bg-border/50 rounded py-3 px-3">
              <Text className="text-secondary">{product.calories}</Text>
            </View>
          </View>

          {/* Protein */}
          <View className="w-[45%] mb-4">
            <Text className="text-secondary/70 text-xs mb-1">Protein</Text>
            <View className="bg-border/50 rounded py-3 px-3">
              <Text className="text-secondary">{product.protein}g</Text>
            </View>
          </View>

          {/* Fat */}
          <View className="w-[45%] mb-4">
            <Text className="text-secondary/70 text-xs mb-1">Fat</Text>
            <View className="bg-border/50 rounded py-3 px-3">
              <Text className="text-secondary">{product.fat}g</Text>
            </View>
          </View>

          {/* Carbs */}
          <View className="w-[45%] mb-4">
            <Text className="text-secondary/70 text-xs mb-1">Carbs</Text>
            <View className="bg-border/50 rounded py-3 px-3">
              <Text className="text-secondary">{product.carbs}g</Text>
            </View>
          </View>

          {/* Sugar */}
          <View className="w-[45%] mb-4">
            <Text className="text-secondary/70 text-xs mb-1">Sugar</Text>
            <View className="bg-border/50 rounded py-3 px-3">
              <Text className="text-secondary">{product.sugar}g</Text>
            </View>
          </View>

          {/* Fibre */}
          <View className="w-[45%] mb-4">
            <Text className="text-secondary/70 text-xs mb-1">Fibre</Text>
            <View className="bg-border/50 rounded py-3 px-3">
              <Text className="text-secondary">{product.fibre}g</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Button */}
      <View className="absolute left-4 right-4 z-50" style={{ bottom: insets.bottom + 24 }}>

        <SubmitButton label="Log" onPress={handleLog} />
      </View>
    </SafeAreaView>
  );
}