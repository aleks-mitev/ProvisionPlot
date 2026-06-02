import React, { useState, useCallback, useMemo } from "react";
import { View, Text, ScrollView, TextInput, Pressable, Image, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, ArrowDownWideNarrow, Search, Star, Plus } from "lucide-react-native";
import { useFocusEffect, router, useLocalSearchParams } from "expo-router";
import { getAllProducts, Product } from "../db/products";
import { useMealBuilderStore } from "../store/mealStore";
import { useDailyLogStore } from "../store/dailyLogStore";

export default function ProductSelectorScreen() {
  const { addIngredient } = useMealBuilderStore();
  const { setTempSelectedProduct } = useDailyLogStore();
  const { mode } = useLocalSearchParams();
  const [filterStarred, setFilterStarred] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [sortOption, setSortOption] = useState("recent");
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  const SORT_OPTIONS = [
    { id: "recent", label: "Recent" },
    { id: "az", label: "A-Z" },
    { id: "protein", label: "Highest Protein" },
    { id: "calories", label: "Lowest Calories" },
  ];

  useFocusEffect(
    useCallback(() => {
      try {
        const products = getAllProducts();
        setDbProducts(products);
      } catch (error) {
        console.error("Failed to load products:", error);
      }
    }, [])
  );

  const sortData = useCallback((a: any, b: any) => {
    if (sortOption === "az") return a.name.localeCompare(b.name);
    if (sortOption === "recent") return b.id - a.id;
    if (sortOption === "protein") return (b.protein ?? 0) - (a.protein ?? 0);
    if (sortOption === "calories") return (a.calories ?? 0) - (b.calories ?? 0);
    return 0;
  }, [sortOption]);

  const filteredProducts = useMemo(() => {
    const result = dbProducts.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStar = filterStarred ? product.is_favorite === 1 : true;
      return matchesSearch && matchesStar;
    });
    return result.sort(sortData);
  }, [dbProducts, searchQuery, filterStarred, sortData]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 bg-background">
        {/* Header (Fixed Top) */}
        <View className="flex-row items-center justify-between px-4 py-4">
          <Pressable onPress={() => router.back()}>
            <ArrowLeft size={24} color="#cacbaf" />
          </Pressable>
          <Text className="text-secondary text-lg font-semibold">
            Choose Product
          </Text>
          <View className="w-6" />
        </View>

        {/* Header Bottom Border */}
        <View className="h-[0.5px] bg-secondary/20" />

        {/* Scrollable Content */}
        <ScrollView className="flex-1">

          {/* Control Row */}
          <View className="flex-row items-center px-4 py-3 gap-x-4">
            <View className="flex-1 flex-row items-center bg-black/20 rounded-xl px-3 h-11">
              <Search size={20} color="#cacbaf" />
              <TextInput
                className="flex-1 text-secondary ml-2 h-full"
                placeholder="Search..."
                placeholderTextColor="#cacbaf50"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Sort Icon */}
            <Pressable onPress={() => setIsSortMenuOpen(true)} className="p-3 items-center justify-center">
              <ArrowDownWideNarrow size={24} color="#cacbaf" />
            </Pressable>

            {/* Filter Star */}
            <Pressable onPress={() => setFilterStarred(!filterStarred)} className="p-3">
              <Star
                size={24}
                color="#d89b22"
                fill={filterStarred ? "#d89b22" : "transparent"}
              />
            </Pressable>
          </View>

          {/* Product List */}
          <View className="px-4">
            {filteredProducts.length === 0 ? (
              <Text className="text-secondary/50 text-lg text-center mt-10">No saved products</Text>
            ) : filteredProducts.map((product, index) => (
              <Pressable
                key={product.id}
                onPress={() => {
                  if (mode === 'log_meal') {
                    setTempSelectedProduct(product);
                  } else {
                    addIngredient(product);
                  }
                  router.back();
                }}
                className={`flex-row items-center py-4 ${index < filteredProducts.length - 1 ? "border-b border-secondary/10" : ""
                  }`}
              >
                {/* Star Column */}
                <View className="w-10 items-center justify-center">
                  {product.is_favorite === 1 ? (
                    <Star size={20} color="#d89b22" fill="#d89b22" />
                  ) : null}
                </View>

                {/* Name Column */}
                <Text className="flex-1 text-secondary text-lg font-bold">
                  {product.name}
                </Text>

                {/* Info Column */}
                <View className="flex-col items-end pr-4">
                  <Text className="text-secondary">{product.calories} cal</Text>
                  <Text className="text-secondary/70 text-sm">
                    {product.protein}g protein
                  </Text>
                </View>

                {/* Action Column */}
                <View>
                  <Plus size={24} color="#cacbaf" />
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Sort Menu Modal */}
        <Modal transparent={true} visible={isSortMenuOpen} animationType="fade" statusBarTranslucent={true}>
          <Pressable 
            className="flex-1 justify-center items-center bg-black/50" 
            onPress={() => setIsSortMenuOpen(false)}
          >
            <View 
              className="bg-border rounded-xl p-4 w-3/4"
              onStartShouldSetResponder={() => true}
            >
              <Text className="text-lg font-bold text-primary mb-4">Sort By</Text>
              {SORT_OPTIONS.map((sort, index) => (
                <Pressable
                  key={sort.id}
                  className={`py-3 ${index !== SORT_OPTIONS.length - 1 ? 'border-b border-secondary/10' : ''}`}
                  onPress={() => {
                    setSortOption(sort.id);
                    setIsSortMenuOpen(false);
                  }}
                >
                  <Text className={`text-base text-center ${sort.id === sortOption ? 'text-primary font-bold' : 'text-secondary'}`}>
                    {sort.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
}