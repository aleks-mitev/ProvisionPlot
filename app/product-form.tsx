import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, Pressable, Alert, TouchableOpacity, Platform, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Star } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { insertProduct, getProductById, updateProduct, deleteProduct } from "../db/products";
import SectionDivider from "../components/SectionDivider";
import SubmitButton from '@/components/SubmitButton';

export default function ProductFormScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const [isFavorited, setIsFavorited] = useState(false);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [carbs, setCarbs] = useState("");
  const [sugar, setSugar] = useState("");
  const [fibre, setFibre] = useState("");
  const [brand, setBrand] = useState("");
  const [packetSize, setPacketSize] = useState("");
  const [price, setPrice] = useState("");
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
      const id = parseInt(editId, 10);
      const product = getProductById(id);
      if (product) {
        setIsFavorited(product.is_favorite === 1);
        setName(product.name);
        setCalories(product.calories.toString());
        setProtein(product.protein.toString());
        setFat(product.fat.toString());
        setCarbs(product.carbs.toString());
        setSugar(product.sugar.toString());
        setFibre(product.fibre.toString());
        setBrand(product.brand || "");
        setPacketSize(product.packet_size?.toString() || "");
        setPrice(product.price?.toString() || "");
      }
    }
  }, [editId]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Product name is required.");
      return;
    }

    const favoriteInt = isFavorited ? 1 : 0;

    if (editId) {
      updateProduct(
        parseInt(editId, 10),
        name.trim(),
        parseFloat(calories) || 0,
        parseFloat(protein) || 0,
        parseFloat(fat) || 0,
        parseFloat(carbs) || 0,
        parseFloat(sugar) || 0,
        parseFloat(fibre) || 0,
        brand.trim(),
        parseFloat(packetSize) || 0,
        parseFloat(price) || 0,
        favoriteInt
      );
    } else {
      insertProduct(
        name.trim(),
        parseFloat(calories) || 0,
        parseFloat(protein) || 0,
        parseFloat(fat) || 0,
        parseFloat(carbs) || 0,
        parseFloat(sugar) || 0,
        parseFloat(fibre) || 0,
        brand.trim(),
        parseFloat(packetSize) || 0,
        parseFloat(price) || 0,
        favoriteInt
      );
    }
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 bg-background">
        {/* Header (Fixed Top) */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-[#333]">
          <Pressable onPress={() => router.back()}>
            <ArrowLeft size={24} color="#cacbaf" />
          </Pressable>
          <Text className="text-xl font-bold text-secondary">
            {editId ? "Edit Product" : "Add Product"}
          </Text>
          <Pressable onPress={() => setIsFavorited(!isFavorited)}>
            {isFavorited ? (
              <Star size={24} color="#d89b22" fill="#d89b22" />
            ) : (
              <Star size={24} color="#d89b22" />
            )}
          </Pressable>
        </View>

        {/* Form Body (Scrollable Middle) */}
        <ScrollView
          className="flex-1 px-4 pt-4"
          contentContainerStyle={{ paddingBottom: keyboardSpace - 45, gap: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        >
          {/* Name input */}
          <View>
            <Text className="text-secondary/70 text-sm mb-1">Name</Text>
            <TextInput
              className="bg-surface text-secondary rounded-lg p-3"
              placeholder="Enter product name"
              placeholderTextColor="#cacbaf50"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Per 100g label */}
          <SectionDivider label="ADJUST PER 100G VALUES" />

          {/* Row 1: Calories and Protein */}
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-secondary/70 text-sm">Calories</Text>
              <TextInput
                className="bg-surface text-secondary rounded-lg p-3"
                placeholder="0"
                placeholderTextColor="#cacbaf50"
                keyboardType="numeric"
                value={calories}
                onChangeText={(text) => setCalories(text.replace(/^0+(?=\d)/, ''))}
              />
            </View>
            <View className="flex-1">
              <Text className="text-secondary/70 text-sm">Protein</Text>
              <TextInput
                className="bg-surface text-secondary rounded-lg p-3"
                placeholder="0"
                placeholderTextColor="#cacbaf50"
                keyboardType="numeric"
                value={protein}
                onChangeText={(text) => setProtein(text.replace(/^0+(?=\d)/, ''))}
              />
            </View>
          </View>

          {/* Row 2: Fat and Carbs */}
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-secondary/70 text-sm">Fat</Text>
              <TextInput
                className="bg-surface text-secondary rounded-lg p-3"
                placeholder="0"
                placeholderTextColor="#cacbaf50"
                keyboardType="numeric"
                value={fat}
                onChangeText={(text) => setFat(text.replace(/^0+(?=\d)/, ''))}
              />
            </View>
            <View className="flex-1">
              <Text className="text-secondary/70 text-sm">Carbs</Text>
              <TextInput
                className="bg-surface text-secondary rounded-lg p-3"
                placeholder="0"
                placeholderTextColor="#cacbaf50"
                keyboardType="numeric"
                value={carbs}
                onChangeText={(text) => setCarbs(text.replace(/^0+(?=\d)/, ''))}
              />
            </View>
          </View>

          {/* Row 3: Sugar and Fibre */}
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-secondary/70 text-sm">Sugar</Text>
              <TextInput
                className="bg-surface text-secondary rounded-lg p-3"
                placeholder="0"
                placeholderTextColor="#cacbaf50"
                keyboardType="numeric"
                value={sugar}
                onChangeText={(text) => setSugar(text.replace(/^0+(?=\d)/, ''))}
              />
            </View>
            <View className="flex-1">
              <Text className="text-secondary/70 text-sm">Fibre</Text>
              <TextInput
                className="bg-surface text-secondary rounded-lg p-3"
                placeholder="0"
                placeholderTextColor="#cacbaf50"
                keyboardType="numeric"
                value={fibre}
                onChangeText={(text) => setFibre(text.replace(/^0+(?=\d)/, ''))}
              />
            </View>
          </View>

          {/* Additional Info label */}
          <SectionDivider label="ADDITIONAL INFO" />

          {/* Brand name input */}
          <View>
            <Text className="text-secondary/70 text-sm mb-1">Brand name</Text>
            <TextInput
              className="bg-surface text-secondary rounded-lg p-3"
              placeholder="Enter product brand"
              placeholderTextColor="#cacbaf50"
              value={brand}
              onChangeText={setBrand}
            />
          </View>

          {/* Row 4: Packet size and Price */}
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-secondary/70 text-sm">Packet size</Text>
              <TextInput
                className="bg-surface text-secondary rounded-lg p-3"
                placeholder="0"
                placeholderTextColor="#cacbaf50"
                keyboardType="numeric"
                value={packetSize}
                onChangeText={(text) => setPacketSize(text.replace(/^0+(?=\d)/, ''))}
              />
            </View>
            <View className="flex-1">
              <Text className="text-secondary/70 text-sm">Price</Text>
              <TextInput
                className="bg-surface text-secondary rounded-lg p-3"
                placeholder="0"
                placeholderTextColor="#cacbaf50"
                keyboardType="numeric"
                value={price}
                onChangeText={(text) => setPrice(text.replace(/^0+(?=\d)/, ''))}
              />
            </View>
          </View>

          {/* Delete button */}
          {editId && (
            <TouchableOpacity
              className="bg-red-500/10 border border-red-500/30 py-4 rounded-xl items-center mt-6 mb-4"
              onPress={() => {
                const parsedId = parseInt(editId, 10);
                deleteProduct(parsedId);
                router.back();
              }}
            >
              <Text className="text-red-500 font-bold text-base">Delete Product</Text>
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
