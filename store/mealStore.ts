import { create } from 'zustand';
import { Product } from '../db/products';

type ActiveIngredient = {
    product: Product;
    grams: string;
};

interface MealBuilderState {
    mealName: string;
    ingredients: ActiveIngredient[];
    setMealName: (name: string) => void;
    addIngredient: (product: Product) => void;
    updateGrams: (productId: number, grams: string) => void;
    clearBuilder: () => void;
    setMealState: (name: string, ingredients: ActiveIngredient[]) => void;
    removeIngredient: (productId: number) => void;
}

export const useMealBuilderStore = create<MealBuilderState>((set) => ({
    mealName: "",
    ingredients: [],

    setMealName: (name) => set({ mealName: name }),

    addIngredient: (newProduct) => set((state) => {
        // Prevent adding the exact same product twice
        const exists = state.ingredients.find(i => i.product.id === newProduct.id);
        if (exists) return state;

        return {
            ingredients: [...state.ingredients, { product: newProduct, grams: "100" }]
        };
    }),

    updateGrams: (productId, newGrams) => set((state) => ({
        ingredients: state.ingredients.map(item =>
            item.product.id === productId ? { ...item, grams: newGrams } : item
        )
    })),

    // Wipes the form inputs clean after a successful save or if the user cancels
    clearBuilder: () => set({ mealName: "", ingredients: [] }),

    setMealState: (name, ingredients) => set({ mealName: name, ingredients: ingredients }),

    removeIngredient: (productId) => set((state) => ({
        ingredients: state.ingredients.filter(item => item.product.id !== productId)
    })),
}));