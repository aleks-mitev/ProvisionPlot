import { create } from 'zustand';
import { 
    FastRecord, 
    insertFast, 
    updateFastEnd, 
    updateFastTarget, 
    updateFastStart, 
    deleteFast, 
    getActiveFast, 
    getPastFasts 
} from '../db/fasts';

interface FastingState {
    activeFast: FastRecord | null;
    pastFasts: FastRecord[];
    loadFasts: () => void;
    beginFast: (startTime: string, targetHours: number | null) => void;
    breakFast: (endTime: string) => void;
    updateActiveTarget: (targetHours: number | null) => void;
    updateActiveStart: (startTime: string) => void;
    updatePastFast: (id: number, startTime: Date, endTime: Date) => void;
    removePastFast: (id: number) => void;
}

export const useFastingStore = create<FastingState>((set, get) => ({
    activeFast: null,
    pastFasts: [],
    
    loadFasts: () => {
        const active = getActiveFast();
        const past = getPastFasts();
        set({ activeFast: active, pastFasts: past });
    },
    
    beginFast: (startTime: string, targetHours: number | null) => {
        insertFast(startTime, targetHours);
        get().loadFasts();
    },
    
    breakFast: (endTime: string) => {
        const active = get().activeFast;
        if (active) {
            updateFastEnd(active.id, endTime);
            get().loadFasts();
        }
    },
    
    updateActiveTarget: (targetHours: number | null) => {
        const active = get().activeFast;
        if (active) {
            updateFastTarget(active.id, targetHours);
            get().loadFasts();
        }
    },
    
    updateActiveStart: (startTime: string) => {
        const active = get().activeFast;
        if (active) {
            updateFastStart(active.id, startTime);
            get().loadFasts();
        }
    },
    
    updatePastFast: (id: number, startTime: Date, endTime: Date) => {
        updateFastStart(id, startTime.toISOString());
        updateFastEnd(id, endTime.toISOString());
        get().loadFasts();
    },
    
    removePastFast: (id: number) => {
        deleteFast(id);
        get().loadFasts();
    }
}));
