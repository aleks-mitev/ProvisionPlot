import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Keyboard,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MoreVertical, Trash2 } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Svg, { Circle } from 'react-native-svg';
import { useFastingStore } from '../../store/fastingStore';
import SectionDivider from '../../components/SectionDivider';

const getProjectedTargetText = (startTime: number, targetHours: number) => {
  if (!startTime) return '';

  const targetDate = new Date(startTime + (targetHours * 60 * 60 * 1000));
  const now = new Date();

  const timeString = targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  // Check if Today
  if (targetDate.toDateString() === now.toDateString()) {
    return `Target set for Today at ${timeString}`;
  }

  // Check if Tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (targetDate.toDateString() === tomorrow.toDateString()) {
    return `Target set for Tomorrow at ${timeString}`;
  }

  // Check if more than 7 days away
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  if (targetDate > sevenDaysFromNow) {
    const dateString = targetDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `Target set for ${dateString} at ${timeString}`;
  }

  // Otherwise, it is within the week, use the Day of the Week
  const dayName = targetDate.toLocaleDateString([], { weekday: 'long' });
  return `Target set for ${dayName} at ${timeString}`;
};

export default function FastingScreen() {
  const {
    activeFast,
    pastFasts,
    loadFasts,
    beginFast,
    breakFast,
    updateActiveTarget,
    updateActiveStart,
    updatePastFast,
    removePastFast,
  } = useFastingStore();

  const isFasting = !!activeFast;

  // Local state for setting up a fast when not fasting
  const [localTargetHours, setLocalTargetHours] = useState('');
  const [isRingFocused, setIsRingFocused] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalEditValue, setModalEditValue] = useState('');

  // Pickers
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

  const ringInputRef = useRef<TextInput>(null);
  const modalInputRef = useRef<TextInput>(null);

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const [isPastModalVisible, setIsPastModalVisible] = useState(false);
  const [selectedPastId, setSelectedPastId] = useState<number | null>(null);
  const [pastStartTime, setPastStartTime] = useState(new Date());
  const [pastEndTime, setPastEndTime] = useState(new Date());
  const [pickerTarget, setPickerTarget] = useState<'activeStart' | 'pastStart' | 'pastEnd'>('activeStart');

  // Load state on mount
  useEffect(() => {
    loadFasts();
  }, [loadFasts]);

  // Live Progress Calculation
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!isFasting) return;
    setNow(Date.now());
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 10000); // Ticks every 10 seconds
    return () => clearInterval(interval);
  }, [isFasting]);

  // --- Timestamp Math Engine ---
  let elapsedMs = 0;
  let progress = 1;
  let displayDuration = '0h 00m';
  let displayRemaining = '0h 00m';
  let targetLabel = 'REMAINING';
  const targetHours = activeFast?.target_hours || null;
  const fastStartTime = activeFast ? new Date(activeFast.start_time).getTime() : 0;

  if (activeFast) {
    const startMs = new Date(activeFast.start_time).getTime();
    elapsedMs = Math.max(0, now - startMs);

    const elHrs = Math.floor(elapsedMs / 3600000);
    const elMins = Math.floor((elapsedMs % 3600000) / 60000);
    displayDuration = `${elHrs}h ${String(elMins).padStart(2, '0')}m`;

    if (activeFast.target_hours) {
      const targetMs = activeFast.target_hours * 3600000;
      const diffMs = targetMs - elapsedMs;

      // Ring stays at 100% full when past target
      progress = Math.min(1, elapsedMs / targetMs);

      const isPastTarget = diffMs < 0;
      const absMs = Math.abs(diffMs);

      const remHrs = Math.floor(absMs / 3600000);
      const remMins = Math.floor((absMs % 3600000) / 60000);

      displayRemaining = `${isPastTarget ? '+ ' : ''}${remHrs}h ${String(remMins).padStart(2, '0')}m`;
      targetLabel = isPastTarget ? 'BEYOND TARGET' : 'REMAINING';
    }
  }

  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const hasTarget = targetHours && targetHours > 0;
  const isOvertime = activeFast && hasTarget && (elapsedSeconds >= targetHours * 3600);

  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const handleRingTargetChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').replace(/^0+/, '');
    setLocalTargetHours(cleaned);
  };

  const handleBeginFast = () => {
    const target = localTargetHours ? parseFloat(localTargetHours) : null;
    beginFast(new Date().toISOString(), target);
    Keyboard.dismiss();
  };

  const handleBreakFast = () => {
    breakFast(new Date().toISOString());
  };

  const openEditModal = () => {
    setModalEditValue(targetHours ? String(targetHours) : '');
    setIsModalVisible(true);
  };

  const saveModalTarget = () => {
    const cleaned = modalEditValue.replace(/[^0-9]/g, '').replace(/^0+/, '');
    const target = cleaned ? parseFloat(cleaned) : null;
    updateActiveTarget(target);
    setIsModalVisible(false);
  };

  const clearRingTarget = () => {
    setLocalTargetHours('');
    Keyboard.dismiss();
  };

  const handleDelete = (id: number) => {
    removePastFast(id);
    setOpenMenuId(null);
  };

  // Date & Time Formatting
  const getDisplayDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getFastDateRange = (startStr: string, endStr: string | null) => {
    const startDisplay = getDisplayDate(startStr);
    if (!endStr) return startDisplay;

    const startDate = new Date(startStr);
    const endDate = new Date(endStr);

    if (startDate.toDateString() === endDate.toDateString()) {
      return startDisplay;
    }

    const endDisplay = getDisplayDate(endStr);
    return `${startDisplay} - ${endDisplay}`;
  };

  const getDisplayTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const getDurationString = (start: string, end: string | null) => {
    if (!end) return '0h 00m';
    const durationMs = new Date(end).getTime() - new Date(start).getTime();
    const hrs = Math.floor(durationMs / 3600000);
    const mins = Math.floor((durationMs % 3600000) / 60000);
    return `${hrs}h ${String(mins).padStart(2, '0')}m`;
  };

  // Picker Handling
  const handlePickerChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShowPicker(false);
      return;
    }
    if (selectedDate) {
      const timeNow = new Date();
      let currentDate = activeFast ? new Date(activeFast.start_time) : new Date();
      if (pickerTarget === 'pastStart') currentDate = pastStartTime;
      if (pickerTarget === 'pastEnd') currentDate = pastEndTime;

      if (pickerMode === 'date') {
        const newDate = new Date(currentDate);
        newDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

        const finalDate = newDate > timeNow ? timeNow : newDate;
        if (pickerTarget === 'activeStart') updateActiveStart(finalDate.toISOString());
        else if (pickerTarget === 'pastStart') setPastStartTime(finalDate);
        else setPastEndTime(finalDate);

        setPickerMode('time');
        if (Platform.OS === 'android') {
          setShowPicker(false);
          setTimeout(() => setShowPicker(true), 50);
        }
      } else {
        const newDate = new Date(currentDate);
        newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());

        const finalDate = newDate > timeNow ? timeNow : newDate;
        if (pickerTarget === 'activeStart') updateActiveStart(finalDate.toISOString());
        else if (pickerTarget === 'pastStart') setPastStartTime(finalDate);
        else setPastEndTime(finalDate);

        setShowPicker(false);
      }
    }
  };

  const maxDate = new Date();
  const minDate = new Date();
  minDate.setDate(minDate.getDate() - 5);

  let currentStartTimeObj = new Date();
  if (pickerTarget === 'pastStart') currentStartTimeObj = pastStartTime;
  else if (pickerTarget === 'pastEnd') currentStartTimeObj = pastEndTime;
  else if (activeFast) currentStartTimeObj = new Date(activeFast.start_time);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      {/* Header */}
      <View className="h-[68px] border-b border-border flex-row items-center justify-between px-4">
        <View className="h-8 w-16" />
        <Text className="text-secondary text-3xl font-bold">
          {!activeFast ? "Not Fasting" : isOvertime ? "Target Achieved" : "Active Fast"}
        </Text>
        <View className="h-8 w-16 items-end justify-center">
          {isFasting && (
            <TouchableOpacity onPress={openEditModal} className="py-2 pl-4">
              <Text className="text-sm font-bold tracking-widest text-secondary/60">
                Edit
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => {
          setOpenMenuId(null);
          Keyboard.dismiss();
        }}
        keyboardShouldPersistTaps="handled">
        {/* Ring Area */}
        <View className="mb-10 items-center justify-center">
          <View className="relative h-72 w-72 items-center justify-center overflow-hidden rounded-full bg-background">
            {/* SVG Background/Foreground */}
            <View className="absolute inset-0">
              {isFasting ? (
                <View className="absolute bottom-0 left-0 right-0 top-0">
                  {/* New SVG Wrapper */}
                  <Svg width="100%" height="100%" viewBox="0 0 288 288">
                    {activeFast?.target_hours && (
                      <Circle
                        cx="144"
                        cy="144"
                        r={radius}
                        stroke="#2A2A2A"
                        strokeWidth="8"
                        fill="none"
                      />
                    )}
                    <Circle
                      cx="144"
                      cy="144"
                      r={radius}
                      stroke="#d89b22"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      transform="rotate(-90 144 144)"
                    />
                  </Svg>
                </View>
              ) : (
                <View className="h-full w-full rounded-full border-[8px] border-primary" />
              )}
            </View>

            {/* Content Overlays */}
            <View className="z-10 h-full w-full items-center justify-center">
              {isFasting ? (
                <View className="z-10 items-center justify-center">
                  {activeFast.target_hours ? (
                    <>
                      <View className="h-20 flex-row items-end justify-center">
                        <Text className="text-6xl font-bold leading-none tracking-tighter text-primary">
                          {displayRemaining.split('h ')[0]}h
                        </Text>
                        <Text className="ml-2 pb-1 text-4xl font-bold leading-none tracking-tighter text-primary">
                          {displayRemaining.split('h ')[1]}
                        </Text>
                      </View>
                      <Text className="mt-4 text-xs font-bold tracking-widest text-secondary/50">
                        {targetLabel}
                      </Text>
                    </>
                  ) : (
                    <>
                      <View className="h-20 flex-row items-end justify-center">
                        <Text className="text-6xl font-bold leading-none tracking-tighter text-primary">
                          {displayDuration.split('h ')[0]}h
                        </Text>
                        <Text className="ml-2 pb-1 text-4xl font-bold leading-none tracking-tighter text-primary">
                          {displayDuration.split('h ')[1]}
                        </Text>
                      </View>
                      <Text className="mt-4 text-xs font-bold tracking-widest text-secondary/50">
                        DURATION
                      </Text>
                    </>
                  )}
                </View>
              ) : (
                <Pressable
                  onPress={() => ringInputRef.current?.focus()}
                  className="relative h-full w-full items-center justify-center">
                  <TextInput
                    ref={ringInputRef}
                    value={localTargetHours}
                    onChangeText={handleRingTargetChange}
                    keyboardType="numeric"
                    maxLength={3}
                    caretHidden={true}
                    onFocus={() => setIsRingFocused(true)}
                    onBlur={() => setIsRingFocused(false)}
                    className="absolute z-10 h-full w-full opacity-0"
                  />

                  <View className="pointer-events-none mt-4 h-24 flex-row items-end justify-center">
                    <Text className="text-[80px] font-bold leading-none text-primary">
                      {localTargetHours || '0'}
                    </Text>
                    <Text className="ml-2 pb-2 text-4xl font-bold leading-none text-primary">
                      h
                    </Text>
                  </View>

                  <View className="z-20 h-10 justify-center">
                    {isRingFocused && localTargetHours !== '' ? (
                      <TouchableOpacity onPress={clearRingTarget} className="z-30 px-4 py-2">
                        <Text className="text-center text-xs font-bold uppercase tracking-widest text-[#ff4444]">
                          Clear Target
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <Text className="pointer-events-none text-center text-xs font-bold uppercase tracking-widest text-secondary/40">
                        Tap to set target
                      </Text>
                    )}
                  </View>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* Action Area */}
        <View className="mb-8 px-6">
          <TouchableOpacity
            onPress={isFasting ? handleBreakFast : handleBeginFast}
            className={`items-center rounded-xl border py-4 ${isFasting ? 'border-[#ff4444]/40 bg-[#ff4444]/10' : 'border-transparent bg-primary'
              }`}>
            <Text
              className={`text-lg font-bold tracking-wider ${isFasting ? 'text-[#ff4444]' : 'text-background'
                }`}>
              {isFasting ? 'BREAK FAST' : 'BEGIN FAST'}
            </Text>
          </TouchableOpacity>

          {/* Sub-button text space to maintain fixed height */}
          {isFasting && targetHours ? (
            <View className="items-center mt-3">
              <Text className="text-secondary/60 text-xs font-bold uppercase">
                Total Duration {displayDuration}
              </Text>

              {activeFast && !isOvertime && (
                <Text className="text-secondary/60 text-xs font-bold mt-2 text-center uppercase">
                  {getProjectedTargetText(fastStartTime, targetHours || 0)}
                </Text>
              )}
            </View>
          ) : (
            <View className="mt-3 h-6 items-center justify-center" />
          )}
        </View>

        {/* History Divider */}
        <SectionDivider label="PREVIOUS FASTS" />

        {/* History List */}
        <View className="px-4">
          {pastFasts.length === 0 ? (
            <Text className="mt-4 text-center italic text-secondary/50">
              No recorded fasts
            </Text>
          ) : (
            pastFasts.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  setSelectedPastId(item.id);
                  setPastStartTime(new Date(item.start_time));
                  setPastEndTime(new Date(item.end_time!));
                  setIsPastModalVisible(true);
                }}
                className="flex-row items-center justify-between py-4 border-b border-border"
              >
                <Text className="text-secondary font-bold text-lg">{getFastDateRange(item.start_time, item.end_time)}</Text>
                <View className="flex-row items-center">
                  <Text className="text-primary text-2xl font-bold mr-3">{getDurationString(item.start_time, item.end_time)}</Text>
                  <View className="p-2 -mr-2">
                    <MoreVertical color="#cacbaf" opacity={0.6} size={20} />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Native Date/Time Picker */}
      {showPicker && (
        <DateTimePicker
          value={currentStartTimeObj}
          mode={pickerMode}
          display="default"
          maximumDate={maxDate}
          minimumDate={minDate}
          onChange={handlePickerChange}
        />
      )}

      {/* Edit Active Fast Modal */}
      {isFasting && (
        <Modal visible={isModalVisible} transparent animationType="fade">
          <Pressable
            className="flex-1 items-center justify-center bg-black/80 px-4"
            onPress={() => setIsModalVisible(false)}>
            <Pressable
              className="w-[80%] max-w-[320px] rounded-3xl border border-border bg-background p-6"
              onPress={(e) => e.stopPropagation()}>
              <Text className="mb-2 text-center text-xl font-bold text-primary">Edit Fast</Text>

              {/* Start Time Divider Label */}
              <SectionDivider label="Start Time" />

              {/* Start Time Editor */}
              <View className="mb-2 flex-row items-center justify-center">
                <TouchableOpacity
                  onPress={() => {
                    setPickerTarget('activeStart');
                    setPickerMode('date');
                    setShowPicker(true);
                  }}
                  className="z-20 mr-2 rounded-lg border border-border bg-border/40 px-4 py-2.5">
                  <Text className="font-bold text-secondary">
                    {getDisplayDate(activeFast.start_time)}
                  </Text>
                </TouchableOpacity>
                <Text className="mr-2 text-sm text-secondary">at</Text>
                <TouchableOpacity
                  onPress={() => {
                    setPickerTarget('activeStart');
                    setPickerMode('time');
                    setShowPicker(true);
                  }}
                  className="z-20 rounded-lg border border-border bg-border/40 px-4 py-2.5">
                  <Text className="font-bold text-secondary">
                    {getDisplayTime(activeFast.start_time)}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Target Hours Divider Label */}
              <SectionDivider label="Target Hours" />

              {/* Target Edit Area */}
              <View className="mb-6 flex-row items-center justify-center">
                <Pressable
                  onPress={() => modalInputRef.current?.focus()}
                  className="relative mr-3 h-14 w-24 overflow-hidden rounded-xl border border-border bg-border/40">
                  <TextInput
                    ref={modalInputRef}
                    value={modalEditValue}
                    onChangeText={setModalEditValue}
                    keyboardType="numeric"
                    maxLength={3}
                    caretHidden={true}
                    className="absolute z-10 h-full w-full opacity-0"
                  />
                  <View className="pointer-events-none flex-1 flex-row items-center justify-center">
                    <Text
                      className={`text-2xl font-bold ${modalEditValue ? 'text-secondary' : 'text-secondary/40'}`}>
                      {modalEditValue || '0'}
                    </Text>
                    <Text
                      className={`ml-1 text-xl font-bold ${modalEditValue ? 'text-secondary' : 'text-secondary/40'}`}>
                      h
                    </Text>
                  </View>
                </Pressable>

                {/* Fixed-width Action Area */}
                <View className="z-20 w-16 items-center justify-center">
                  {!modalEditValue || modalEditValue === '0' ? (
                    <Text className="text-center text-sm font-bold uppercase tracking-widest text-secondary/40">
                      None
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={() => setModalEditValue('')} className="z-30 p-2">
                      <Text className="text-base font-bold text-[#ff4444]">Clear</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Modal Actions */}
              <View className="mt-4">
                <TouchableOpacity
                  onPress={saveModalTarget}
                  className="z-20 w-full items-center rounded-xl bg-primary py-3.5">
                  <Text className="text-base font-bold text-background">Save Changes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setIsModalVisible(false)}
                  className="z-20 w-full items-center py-3 mt-2">
                  <Text className="text-base font-bold text-secondary/60">Cancel</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Edit Past Fast Modal */}
      <Modal visible={isPastModalVisible} transparent animationType="fade">
        <Pressable className="flex-1 bg-black/80 justify-center items-center px-4" onPress={() => setIsPastModalVisible(false)}>
          <Pressable className="bg-background p-6 rounded-3xl border border-border w-[80%] max-w-[320px]" onPress={(e) => e.stopPropagation()}>
            <View className="relative justify-center items-center mb-2">
              <Text className="text-primary text-xl font-bold text-center">Edit Recorded Fast</Text>
              <TouchableOpacity
                onPress={() => {
                  if (selectedPastId) removePastFast(selectedPastId);
                  setIsPastModalVisible(false);
                }}
                className="absolute right-0 p-2 -mr-2"
              >
                <Trash2 color="#ff4444" size={20} />
              </TouchableOpacity>
            </View>

            {/* Started Section */}
            <SectionDivider label="Started" />

            <View className="flex-row items-center justify-center mb-2">
              <TouchableOpacity onPress={() => { setPickerTarget('pastStart'); setPickerMode('date'); setShowPicker(true); }} className="bg-border/40 px-4 py-2.5 rounded-lg border border-border mr-2 z-20">
                <Text className="text-secondary font-bold">{getDisplayDate(pastStartTime.toISOString())}</Text>
              </TouchableOpacity>
              <Text className="text-secondary text-sm mr-2">at</Text>
              <TouchableOpacity onPress={() => { setPickerTarget('pastStart'); setPickerMode('time'); setShowPicker(true); }} className="bg-border/40 px-4 py-2.5 rounded-lg border border-border z-20">
                <Text className="text-secondary font-bold">{getDisplayTime(pastStartTime.toISOString())}</Text>
              </TouchableOpacity>
            </View>

            {/* Ended Section */}
            <SectionDivider label="Ended" />

            <View className="flex-row items-center justify-center mb-6">
              <TouchableOpacity onPress={() => { setPickerTarget('pastEnd'); setPickerMode('date'); setShowPicker(true); }} className="bg-border/40 px-4 py-2.5 rounded-lg border border-border mr-2 z-20">
                <Text className="text-secondary font-bold">{getDisplayDate(pastEndTime.toISOString())}</Text>
              </TouchableOpacity>
              <Text className="text-secondary text-sm mr-2">at</Text>
              <TouchableOpacity onPress={() => { setPickerTarget('pastEnd'); setPickerMode('time'); setShowPicker(true); }} className="bg-border/40 px-4 py-2.5 rounded-lg border border-border z-20">
                <Text className="text-secondary font-bold">{getDisplayTime(pastEndTime.toISOString())}</Text>
              </TouchableOpacity>
            </View>

            {/* Actions */}
            <View className="mt-4">
              <TouchableOpacity
                onPress={() => {
                  if (selectedPastId) updatePastFast(selectedPastId, pastStartTime, pastEndTime);
                  setIsPastModalVisible(false);
                }}
                className="bg-primary w-full py-3.5 rounded-xl items-center z-20"
              >
                <Text className="text-background font-bold text-base">Save Changes</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setIsPastModalVisible(false)} className="w-full pt-2 pb-1 items-center z-20 mt-2">
                <Text className="text-secondary/60 font-bold text-base">Cancel</Text>
              </TouchableOpacity>
            </View>

          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
