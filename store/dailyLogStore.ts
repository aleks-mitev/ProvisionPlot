import { create } from 'zustand';
import { addDailyLog, getLogsByDate, addMealWithIngredients, updateDailyLog, updateMealWithIngredients, deleteDailyLogEntry } from '../db/dailyLogs';

export interface DailyLogEntry {
    id: number;
    date: string;
    reference_id: number;
    type: string;
    grams_consumed: number;
    calculated_calories: number;
    calculated_protein: number;
    parent_log_id?: number | null;
    name: string;
}

export interface DailyLogState {
    logs: DailyLogEntry[];
    currentDate: string;
    isLoading: boolean;
    fetchLogsForDate: (date: string) => Promise<void>;
    addLogEntry: (logData: Omit<DailyLogEntry, 'id' | 'date'>) => Promise<void>;
    addMealLog: (mealData: any, ingredientsData: any[]) => Promise<void>;
    updateMealLog: (logId: number, mealData: any, ingredientsData: any[]) => Promise<void>;
    updateLogEntry: (id: number, grams: number, calories: number, protein: number) => Promise<void>;
    removeLogEntry: (id: number) => Promise<void>;
    changeDate: (date: string) => void;
    tempSelectedProduct: any | null;
    setTempSelectedProduct: (product: any | null) => void;
}

export const useDailyLogStore = create<DailyLogState>((set, get) => ({
    logs: [],
    currentDate: new Date().toISOString().split('T')[0],
    isLoading: false,
    tempSelectedProduct: null,
    setTempSelectedProduct: (product: any | null) => set({ tempSelectedProduct: product }),
    fetchLogsForDate: async (date: string) => {
        set({ isLoading: true });
        try {
            const logs = await getLogsByDate(date);
            set({ logs, currentDate: date, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch logs:', error);
            set({ isLoading: false });
        }
    },
    addLogEntry: async (logData: Omit<DailyLogEntry, 'id' | 'date'>) => {
        try {
            await addDailyLog({ ...logData, date: get().currentDate });
            await get().fetchLogsForDate(get().currentDate);
        } catch (error) {
            console.error('Failed to add log entry:', error);
        }
    },
    updateLogEntry: async (id: number, grams: number, calories: number, protein: number) => {
        try {
            await updateDailyLog(id, grams, calories, protein);
            await get().fetchLogsForDate(get().currentDate);
        } catch (error) {
            console.error('Failed to update log entry:', error);
        }
    },
    addMealLog: async (mealData: any, ingredientsData: any[]) => {
        try {
            const date = get().currentDate;
            await addMealWithIngredients({ ...mealData, date }, ingredientsData.map(ing => ({ ...ing, date })));
            await get().fetchLogsForDate(date);
        } catch (error) {
            console.error('Failed to add meal log:', error);
        }
    },
    updateMealLog: async (logId: number, mealData: any, ingredientsData: any[]) => {
        try {
            const date = get().currentDate;
            await updateMealWithIngredients(logId, mealData, ingredientsData.map(ing => ({ ...ing, date })));
            await get().fetchLogsForDate(date);
        } catch (error) {
            console.error('Failed to update meal log:', error);
        }
    },
    removeLogEntry: async (id: number) => {
        try {
            await deleteDailyLogEntry(id);
            await get().fetchLogsForDate(get().currentDate);
        } catch (error) {
            console.error('Failed to remove log entry:', error);
        }
    },
    changeDate: (date: string) => {
        set({ currentDate: date });
        get().fetchLogsForDate(date);
    }
}));
