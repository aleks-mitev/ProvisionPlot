import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, X, Plus, Trash2 } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDailyLogStore } from '../store/dailyLogStore';
import { getMealById, getMealIngredientsWithProducts } from '../db/meals';
import SectionDivider from '../components/SectionDivider';
import MacroTotalsDisplay from '@/components/MacroTotalsDisplay';
import SubmitButton from '@/components/SubmitButton';

export default function LogMealScreen() {
  const router = useRouter();
  const { id, log_id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { logs, addMealLog, updateMealLog, tempSelectedProduct, setTempSelectedProduct, removeLogEntry } = useDailyLogStore();

  const [mealName, setMealName] = useState('');
  const [ingredients, setIngredients] = useState<any[]>([]);

  useEffect(() => {
    if (tempSelectedProduct) {
      setIngredients((prev) => {
        if (prev.some((ing) => ing.id === tempSelectedProduct.id)) {
          return prev; // Block duplicate additions
        }
        return [...prev, {
          id: tempSelectedProduct.id,
          name: tempSelectedProduct.name,
          current_grams: 100,
          calories: tempSelectedProduct.calories,
          protein: tempSelectedProduct.protein
        }];
      });
      setTempSelectedProduct(null);
    }
  }, [tempSelectedProduct, setTempSelectedProduct]);

  useEffect(() => {
    if (log_id) {
      const existingParent = logs.find(l => l.id === Number(log_id));
      const existingIngredients = logs.filter(l => l.parent_log_id === Number(log_id));
      if (existingParent) setMealName(existingParent.name);

      const mappedIngredients = existingIngredients.map(ing => ({
        id: ing.reference_id,
        name: ing.name,
        current_grams: ing.grams_consumed,
        calories: (ing.calculated_calories / ing.grams_consumed) * 100,
        protein: (ing.calculated_protein / ing.grams_consumed) * 100
      }));
      setIngredients(mappedIngredients);
      return;
    }

    if (id) {
      const meal = getMealById(Number(id));
      if (meal) {
        setMealName(meal.name);
        const mealIngredients = getMealIngredientsWithProducts(Number(id));
        setIngredients(mealIngredients.map(mi => ({
          id: mi.product.id,
          name: mi.product.name,
          current_grams: Number(mi.grams),
          calories: mi.product.calories,
          protein: mi.product.protein,
        })));
      }
    }
  }, [id]);

  if (!mealName) return null;

  const liveTotalCalories = Math.round(ingredients.reduce((sum, ing) => sum + (ing.calories / 100) * ing.current_grams, 0));
  const liveTotalProtein = Number(ingredients.reduce((sum, ing) => sum + (ing.protein / 100) * ing.current_grams, 0).toFixed(1));
  const liveTotalGrams = ingredients.reduce((sum, ing) => sum + ing.current_grams, 0);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-4 border-b border-border mb-6">
        <TouchableOpacity onPress={() => router.back()} className="w-10">
          <ArrowLeft color="#cacbaf" size={28} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-secondary flex-1 text-center">
          {log_id ? "Edit Logged Meal" : "Log Meal"}
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

      {/* Meal Title */}
      <Text className="text-2xl font-bold text-secondary text-center mb-6">
        {mealName}
      </Text>

      {/* Live Math Preview (Grand Total) */}
      <MacroTotalsDisplay calories={liveTotalCalories} protein={liveTotalProtein} />

      {/* Label + Divider */}
      <SectionDivider label="Adjust Ingredients" />

      {/* Ingredients List (Mapped) */}
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} className="px-4">
        {ingredients.map((ing) => (
          <View key={ing.id} className="flex-row items-center justify-between py-4 border-b border-border/50">
            <Text className="text-lg font-bold text-secondary flex-1 pr-4">
              {ing.name}
            </Text>
            <View className="flex-row items-center">
              <View className="bg-border h-10 rounded-lg flex-row items-center justify-end px-3">
                <TextInput
                  value={String(ing.current_grams)}
                  onChangeText={(text) => {
                    const cleanText = text.replace(/^0+(?=\d)/, '');
                    const numericValue = parseInt(cleanText.replace(/[^0-9]/g, ''), 10);
                    const newGrams = isNaN(numericValue) ? 0 : numericValue;
                    setIngredients(prev => prev.map(item => item.id === ing.id ? { ...item, current_grams: newGrams } : item));
                  }}
                  keyboardType="numeric"
                  maxLength={4}
                  className="text-secondary font-bold text-base p-0 m-0 text-right min-w-[40px]"
                  style={{ includeFontPadding: false }}
                />
                <Text className="text-secondary/50 text-sm ml-1">g</Text>
              </View>
              <TouchableOpacity className="ml-4 opacity-70" onPress={() => setIngredients(prev => prev.filter(item => item.id !== ing.id))}>
                <X size={20} color="#cacbaf" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Add Product Button */}
        <TouchableOpacity
          className="flex-row items-center justify-center py-4 border-2 border-dashed border-border rounded-xl mt-6"
          onPress={() => router.push('/product-selector?mode=log_meal')}
        >
          <Plus size={20} color="#d89b22" />
          <Text className="text-primary font-bold ml-2">Add Product</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Action Button */}
      <View className="absolute left-4 right-4 z-50" style={{ bottom: insets.bottom + 24 }}>

        <SubmitButton
          label="Log"
          onPress={async () => {
            const mealData = {
              reference_id: Number(id),
              type: 'meal',
              name: mealName,
              grams_consumed: liveTotalGrams,
              calculated_calories: liveTotalCalories,
              calculated_protein: liveTotalProtein
            };
            const ingredientsData = ingredients.map(ing => ({
              reference_id: ing.id,
              type: 'product',
              name: ing.name,
              grams_consumed: ing.current_grams,
              calculated_calories: Math.round((ing.calories / 100) * ing.current_grams),
              calculated_protein: Number(((ing.protein / 100) * ing.current_grams).toFixed(1))
            }));
            if (log_id) {
              await updateMealLog(Number(log_id), { grams: liveTotalGrams, calories: liveTotalCalories, protein: liveTotalProtein }, ingredientsData);
            } else {
              await addMealLog(mealData, ingredientsData);
            }
            if (router.canDismiss()) {
              router.dismissAll();
            }
            setTimeout(() => {
              router.navigate('/(tabs)/daily-log');
            }, 100);
          }}
        />
      </View>
    </SafeAreaView>
  );
}