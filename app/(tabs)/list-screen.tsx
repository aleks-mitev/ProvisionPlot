import React, { useState, useCallback, useMemo, useEffect } from "react";
import { View, Text, ScrollView, TextInput, Pressable, Modal, BackHandler } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, router, useLocalSearchParams } from "expo-router";
import {
  ArrowDownWideNarrow,
  Search,
  Star,
  ChevronRight,
  Plus,
} from "lucide-react-native";
import { getAllProducts, Product } from "../../db/products";
import { getAllMeals, Meal } from "../../db/meals";



export default function ListScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const [filterStarred, setFilterStarred] = useState(false);
  const [activeTab, setActiveTab] = useState("PRODUCTS");
  const [savedProducts, setSavedProducts] = useState<Product[]>([]);
  const [savedMeals, setSavedMeals] = useState<Meal[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("recent");
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [isFabReady, setIsFabReady] = useState(false);

  // Prevent accidental double tap on the fab button
  useFocusEffect(
    useCallback(() => {
      setIsFabReady(false);

      const timer = setTimeout(() => {
        setIsFabReady(true);
      }, 800);

      return () => clearTimeout(timer);
    }, [])
  );

  // Make sure back button leads to daily-log screen if in mode logging
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (mode === 'logging') {
          router.push('/daily-log');
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        subscription.remove();
      };
    }, [mode])
  );

  const SORT_OPTIONS = [
    { id: "recent", label: "Recent" },
    { id: "az", label: "A-Z" },
    { id: "protein", label: "Highest Protein" },
    { id: "calories", label: "Lowest Calories" },
  ];

  useFocusEffect(
    useCallback(() => {
      setSavedProducts(getAllProducts());
      setSavedMeals(getAllMeals());
    }, [])
  );

  const sortData = useCallback((a: any, b: any) => {
    if (sortOption === "az") return a.name.localeCompare(b.name);
    if (sortOption === "recent") return b.id - a.id;
    if (sortOption === "protein") return (b.protein ?? b.totalProtein ?? 0) - (a.protein ?? a.totalProtein ?? 0);
    if (sortOption === "calories") return (a.calories ?? a.totalCalories ?? 0) - (b.calories ?? b.totalCalories ?? 0);
    return 0;
  }, [sortOption]);

  const filteredProducts = useMemo(() => {
    let result = savedProducts;
    if (filterStarred) result = result.filter((p) => p.is_favorite === 1);
    if (searchQuery) result = result.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return [...result].sort(sortData);
  }, [savedProducts, filterStarred, searchQuery, sortData]);

  const filteredMeals = useMemo(() => {
    let result = savedMeals;
    if (filterStarred) result = result.filter((m) => m.is_favorite === 1);
    if (searchQuery) result = result.filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return [...result].sort(sortData);
  }, [savedMeals, filterStarred, searchQuery, sortData]);


  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#1A1A1A]">
      <View className="flex-1 bg-[#1A1A1A] relative">
        {/* Tab Switcher Header */}
        <View className="flex-row h-[68px]">
          {/* PRODUCTS Tab */}
          <Pressable
            className={`flex-1 justify-center px-4 ${activeTab === "PRODUCTS"
              ? "bg-background border-t border-border"
              : "bg-[#1A1A1A] border-b border-r border-border"
              }`}
            onPress={() => {
              setActiveTab("PRODUCTS");
              setFilterStarred(false);
              setSearchQuery("");
            }}
          >
            <Text className={`tracking-wider text-center uppercase ${activeTab === "PRODUCTS" ? "font-bold text-2xl text-primary" : "text-xl text-secondary/50"}`}>
              Products
            </Text>
          </Pressable>

          {/* MEALS Tab */}
          <Pressable
            className={`flex-1 justify-center px-4 ${activeTab === "MEALS"
              ? "bg-background border-t border-border"
              : "bg-[#1A1A1A] border-b border-l border-border"
              }`}
            onPress={() => {
              setActiveTab("MEALS");
              setFilterStarred(false);
              setSearchQuery("");
            }}
          >
            <Text className={`tracking-wider text-center uppercase ${activeTab === "MEALS" ? "font-bold text-2xl text-primary" : "text-xl text-secondary/50"}`}>
              Meals
            </Text>
          </Pressable>
        </View>

        <View className="flex-1 bg-background">
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

          {/* List Body */}
          <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
            {activeTab === "PRODUCTS"
              ? filteredProducts.length === 0 ? (
                <Text className="text-secondary/50 text-lg text-center mt-10">No saved products</Text>
              ) : filteredProducts.map((item, index) => (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    if (mode === 'logging') {
                      router.push({ pathname: '/log-product', params: { id: item.id } });
                    } else {
                      router.navigate({ pathname: '/product-form', params: { editId: item.id } });
                    }
                  }}
                  className={`flex-row items-center py-4 border-b border-secondary/10 pr-4 ${index === 0 ? "border-t border-secondary/10" : ""
                    }`}
                >
                  {/* Star Column */}
                  <View className="w-12 items-center justify-center">
                    {item.is_favorite === 1 ? (
                      <Star size={20} color="#d89b22" fill="#d89b22" />
                    ) : null}
                  </View>

                  {/* Name Column */}
                  <Text className="flex-1 text-secondary text-lg font-bold">
                    {item.name}
                  </Text>

                  {/* Info Column */}
                  <View className="flex-col items-end pr-3">
                    <Text className="text-secondary">{item.calories} cal</Text>
                    <Text className="text-secondary/70 text-sm">
                      {item.protein}g protein
                    </Text>
                  </View>

                  {/* Action Column */}
                  {mode === 'logging' ? <Plus size={28} color="#cacbaf" /> : <ChevronRight size={20} color="#cacbaf" />}
                </Pressable>
              ))
              : filteredMeals.length === 0 ? (
                <Text className="text-secondary/50 text-lg text-center mt-10">No saved meals</Text>
              ) : filteredMeals.map((item, index) => (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    if (mode === 'logging') {
                      router.push({ pathname: '/log-meal', params: { id: item.id } });
                    } else {
                      router.navigate({ pathname: '/meal-form', params: { editId: item.id } });
                    }
                  }}
                  className={`flex-row items-center py-4 border-b border-secondary/10 pr-4 ${index === 0 ? "border-t border-secondary/10" : ""
                    }`}
                >
                  {/* Star Column */}
                  <View className="w-12 items-center justify-center">
                    {item.is_favorite === 1 ? (
                      <Star size={20} color="#d89b22" fill="#d89b22" />
                    ) : null}
                  </View>

                  {/* Name Column */}
                  <Text className="flex-1 text-secondary text-lg font-bold">
                    {item.name}
                  </Text>

                  {/* Info Column */}
                  <View className="flex-col items-end pr-3">
                    <Text className="text-secondary">{Math.round(item.totalCalories ?? 0)} cal</Text>
                    <Text className="text-secondary/70 text-sm">
                      {Math.round(item.totalProtein ?? 0)}g protein
                    </Text>
                  </View>

                  {/* Action Column */}
                  {mode === 'logging' ? <Plus size={28} color="#cacbaf" /> : <ChevronRight size={20} color="#cacbaf" />}
                </Pressable>
              ))}
          </ScrollView>

          {/* Floating Action Button */}
          <View className="absolute bottom-6 right-6">
            <Pressable
              className="w-[72px] h-[72px] rounded-full bg-primary items-center justify-center shadow-lg"
              onPress={() => {
                if (!isFabReady) return; // Ignore taps during the transition window

                if (activeTab === "PRODUCTS") {
                  router.push('/product-form');
                } else {
                  router.push('/meal-form');
                }
              }}
            >
              <Plus size={48} color="#1E1E1E" strokeWidth={2} />
            </Pressable>
          </View>

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
                <Text className="text-lg font-bold text-primary text-center mb-4">Sort By</Text>
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
      </View>
    </SafeAreaView>
  );
}
