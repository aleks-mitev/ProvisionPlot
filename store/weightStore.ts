import { create } from 'zustand';
import {
  WeightLog,
  getAllWeightLogs,
  insertWeightLog,
  updateWeightLog,
  deleteWeightLog,
  getAllWeightContexts,
  insertWeightContext,
  deleteWeightContext,
  renameWeightContext,
  initializeDefaultWeightContexts
} from '../db/weightLogs';

export interface WeightState {
  logs: WeightLog[];
  contexts: string[];
  loadWeightData: () => void;
  addLog: (weight: number, timestamp: string, contextTag: string) => void;
  editLog: (id: number, weight: number, timestamp: string, contextTag: string) => void;
  removeLog: (id: number) => void;
  addContext: (tagName: string) => void;
  removeContext: (tagName: string) => void;
  renameContext: (oldName: string, newName: string) => void;
}

export const useWeightStore = create<WeightState>((set, get) => ({
  logs: [],
  contexts: [],
  loadWeightData: () => {
    initializeDefaultWeightContexts();
    const logs = getAllWeightLogs();
    const contexts = getAllWeightContexts();
    set({ logs, contexts });
  },
  addLog: (weight, timestamp, contextTag) => {
    insertWeightLog(weight, timestamp, contextTag);
    get().loadWeightData();
  },
  editLog: (id, weight, timestamp, contextTag) => {
    updateWeightLog(id, weight, timestamp, contextTag);
    get().loadWeightData();
  },
  removeLog: (id) => {
    deleteWeightLog(id);
    get().loadWeightData();
  },
  addContext: (tagName) => {
    insertWeightContext(tagName);
    get().loadWeightData();
  },
  removeContext: (tagName) => {
    deleteWeightContext(tagName);

    // Re-fetch both, because the weight logs table was just modified by the DB function
    const updatedLogs = getAllWeightLogs();
    const updatedContexts = getAllWeightContexts();

    set({ logs: updatedLogs, contexts: updatedContexts });
  },
  renameContext: (oldName, newName) => {
    renameWeightContext(oldName, newName);
    get().loadWeightData();
  }
}));
