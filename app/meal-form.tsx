import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, Pressable, Alert, TouchableOpacity, Platform, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Star, X, Plus } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { insertMeal, insertMealIngredient, getMealById, updateMeal, deleteMealIngredients, getMealIngredientsWithProducts, deleteMeal } from "../db/meals";
import { useMealBuilderStore } from "../store/mealStore";
import SectionDivider from "../components/SectionDivider";
import MacroTotalsDisplay from '@/components/MacroTotalsDisplay';
import SubmitButton from '@/components/SubmitButton';

export default function MealFormScreen() {
  const router = useRouter();
  const { mealName, setMealName, ingredients, updateGrams, clearBuilder, setMealState, removeIngredient } = useMealBuilderStore();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const [isFavorited, setIsFavorited] = useState(false);
  const [keyboardSpace, setKeyboardSpace] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (e) => {
      setKeyboardSpace(e.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardSpace(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (editId) {
      const parsedId = parseInt(editId, 10);
      const meal = getMealById(parsedId);
      if (meal) {
        setIsFavorited(meal.is_favorite === 1);
        const mealIngredients = getMealIngredientsWithProducts(parsedId);
        setMealState(meal.name, mealIngredients);
      }
    }
  }, [editId, setMealState]);

  const handleSave = () => {
    if (!mealName.trim()) {
      Alert.alert("Validation Error", "Meal name is required.");
      return;
    }

    let operationalId: number;

    if (editId) {
      operationalId = parseInt(editId, 10);
      updateMeal(operationalId, mealName.trim(), isFavorited ? 1 : 0);
      deleteMealIngredients(operationalId);
    } else {
      operationalId = insertMeal(mealName.trim(), isFavorited ? 1 : 0);
    }

    for (const ingredient of ingredients) {
      insertMealIngredient(operationalId, ingredient.product.id, parseFloat(ingredient.grams) || 0);
    }
    clearBuilder();
    router.back();
  };

  const liveTotalGrams = ingredients.reduce((sum, ing) => sum + (Number(ing.grams) || 0), 0);
  const liveTotalCalories = ingredients.reduce((sum, ing) => sum + (((Number(ing.product?.calories) || 0) * (Number(ing.grams) || 0)) / 100), 0);
  const liveTotalProtein = ingredients.reduce((sum, ing) => sum + (((Number(ing.product?.protein) || 0) * (Number(ing.grams) || 0)) / 100), 0);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 bg-background">
        {/* Header (Fixed Top) */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-[#333]">
          <Pressable onPress={() => {
            clearBuilder();
            router.back();
          }}>
            <ArrowLeft size={24} color="#cacbaf" />
          </Pressable>
          <Text className="text-xl font-bold text-secondary">
            {editId ? "Edit Meal" : "Add Meal"}
          </Text>
          <Pressable onPress={() => setIsFavorited(!isFavorited)}>
            <Star size={24} color="#d89b22" fill={isFavorited ? "#d89b22" : "none"} />
          </Pressable>
        </View>

        {/* Form Body (Scrollable Middle) */}
        <ScrollView
          className="flex-1 px-4 pt-4"
          contentContainerStyle={{ paddingBottom: keyboardSpace + 40, gap: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        >
          {/* Name input */}
          <View>
            <Text className="text-secondary/70 text-sm mb-1">Name</Text>
            <TextInput
              className="bg-surface text-secondary rounded-lg p-3"
              placeholder="Enter meal name"
              placeholderTextColor="#cacbaf50"
              value={mealName}
              onChangeText={setMealName}
            />
          </View>

          <MacroTotalsDisplay calories={Math.round(liveTotalCalories)} protein={Number(liveTotalProtein).toFixed(1)} />

          {/* Horizontal separator */}
          <SectionDivider label="ADJUST INGREDIENTS" />

          {ingredients.map((ingredient) => (
            <View key={ingredient.product.id} className="flex-row justify-between items-center py-3 border-b border-secondary/10">
              <Text className="text-secondary">{ingredient.product.name}</Text>
              <View className="flex-row items-center gap-3">
                <View className="bg-border h-10 rounded-lg flex-row items-center justify-end px-3 min-w-[75px]">
                  <TextInput
                    value={String(ingredient.grams)}
                    onChangeText={(text) => updateGrams(ingredient.product.id, text.replace(/^0+(?=\d)/, ''))}
                    keyboardType="numeric"
                    maxLength={4}
                    className="font-bold text-base text-right p-0 m-0 text-secondary"
                    style={{ includeFontPadding: false }}
                  />
                  <Text className="text-secondary/50 text-base font-bold ml-1">g</Text>
                </View>
                <Pressable onPress={() => removeIngredient(ingredient.product.id)}>
                  <X size={20} color="#cacbaf" />
                </Pressable>
              </View>
            </View>
          ))}

          {/* Add Product Button */}
          <TouchableOpacity
            className="flex-row items-center justify-center py-4 border-2 border-dashed border-border rounded-xl mt-2"
            onPress={() => router.push("/product-selector")}
          >
            <Plus size={20} color="#d89b22" />
            <Text className="text-primary font-bold ml-2">Add Product</Text>
          </TouchableOpacity>

          {/* Delete button */}
          {editId && (
            <TouchableOpacity
              className="bg-red-500/10 border border-red-500/30 py-4 rounded-xl items-center mt-6 mb-4"
              onPress={() => {
                const parsedId = parseInt(editId, 10);
                deleteMeal(parsedId);
                clearBuilder();
                router.back();
              }}
            >
              <Text className="text-red-500 font-bold text-base">Delete Meal</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Footer (Fixed Bottom) */}
        <View className="p-4">
          <SubmitButton label="Save" onPress={handleSave} />
        </View>
      </View>
    </SafeAreaView>
  );
}