import React, { useEffect, useState } from "react";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useDailyLogStore } from '../../store/dailyLogStore';
import { useSettingsStore } from '../../store/settingsStore';
import { View, Text, ScrollView, Pressable, TouchableOpacity, Modal, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, ChevronRight, ChevronLeft, CornerDownRight, X } from "lucide-react-native";

export default function DailyLogScreen() {
  const router = useRouter(); // Wiring up the router
  const insets = useSafeAreaInsets(); // Get safe area insets
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { logs, currentDate, fetchLogsForDate, changeDate } = useDailyLogStore();
  const { settings, loadSettings, setSetting } = useSettingsStore();

  const [showSettings, setShowSettings] = useState(false);
  const [calInput, setCalInput] = useState(settings['target_calories'] || '');
  const [proInput, setProInput] = useState(settings['target_protein'] || '');

  const handleSaveSettings = async () => {
    await setSetting('target_calories', calInput);
    await setSetting('target_protein', proInput);
    setShowSettings(false);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    fetchLogsForDate(currentDate);
  }, [currentDate, fetchLogsForDate]);

  const topLevelLogs = logs.filter(log => !log.parent_log_id);

  const totalCalories = topLevelLogs.reduce((sum, log) => sum + log.calculated_calories, 0);
  const totalProtein = topLevelLogs.reduce((sum, log) => sum + log.calculated_protein, 0);

  const shiftDate = (dateStr: string, days: number) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d + days);
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
  };

  const getDisplayDate = (dateStr: string) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (dateStr === todayStr) return "Today";

    const yesterdayObj = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    const yesterdayStr = `${yesterdayObj.getFullYear()}-${String(yesterdayObj.getMonth() + 1).padStart(2, '0')}-${String(yesterdayObj.getDate()).padStart(2, '0')}`;
    if (dateStr === yesterdayStr) return "Yesterday";

    const tomorrowObj = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const tomorrowStr = `${tomorrowObj.getFullYear()}-${String(tomorrowObj.getMonth() + 1).padStart(2, '0')}-${String(tomorrowObj.getDate()).padStart(2, '0')}`;
    if (dateStr === tomorrowStr) return "Tomorrow";

    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const monthDay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${weekday} - ${monthDay}`;
  };

  const targetCalories = settings['target_calories'] ? Number(settings['target_calories']) : null;
  const targetProtein = settings['target_protein'] ? Number(settings['target_protein']) : null;

  const calPercentage = targetCalories ? Math.min(100, Math.max(0, (totalCalories / targetCalories) * 100)) : 100;
  const proPercentage = targetProtein ? Math.min(100, Math.max(0, (totalProtein / targetProtein) * 100)) : 100;

  const calRotation = 45 + (calPercentage * 1.8);
  const proRotation = 45 + (proPercentage * 1.8);

  const todayObj = new Date();
  const todayString = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
  const isToday = currentDate === todayString;
  const isFuture = currentDate > todayString;

  const getEmptyStateText = (dateInput: string | Date) => {
    const target = new Date(dateInput);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Normalize times to midnight for accurate day comparison
    target.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);

    if (target.getTime() === today.getTime()) return "No food logged today";
    if (target.getTime() === yesterday.getTime()) return "No food logged yesterday";
    if (target.getTime() > today.getTime()) return null;
    return "No food logged for this date";
  };

  const emptyText = getEmptyStateText(currentDate);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">

      {/* Header: Date Navigator */}
      <View className="h-[68px] border-b border-border flex-row items-center justify-between px-4 mb-6 relative overflow-hidden">
        <TouchableOpacity onPress={() => changeDate(shiftDate(currentDate, -1))} className="z-20 p-2">
          <ChevronLeft color="#d89b22" size={28} strokeWidth={2.5} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} className="flex-1 items-center justify-center px-2 z-20">
          <Text numberOfLines={1} adjustsFontSizeToFit className="text-3xl font-bold text-secondary tracking-wider text-center">
            {getDisplayDate(currentDate)}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={new Date(Number(currentDate.split('-')[0]), Number(currentDate.split('-')[1]) - 1, Number(currentDate.split('-')[2]))}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                const newDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
                changeDate(newDateStr);
              }
            }}
          />
        )}
        <TouchableOpacity onPress={() => changeDate(shiftDate(currentDate, 1))} className="z-20 p-2">
          <ChevronRight color="#d89b22" size={28} strokeWidth={2.5} />
        </TouchableOpacity>


      </View>

      {/* Locked Overlay Container */}
      <View className="flex-1 relative">



        {/* Macro Dashboard: Semi-Circle Gauges */}
        <View className="flex-row justify-around mb-8 px-4">
          {/* Calories Gauge */}
          <TouchableOpacity
            className="items-center"
            onPress={() => { setCalInput(settings['target_calories'] || ''); setProInput(settings['target_protein'] || ''); setShowSettings(true); }}
          >
            <View className="w-[120px] h-[60px] overflow-hidden justify-start relative">
              <View className="absolute top-0 left-0 w-[120px] h-[120px] rounded-full border-[10px] border-secondary/20" />
              <View
                className="absolute top-0 left-0 w-[120px] h-[120px] rounded-full border-[10px] border-primary border-t-transparent border-l-transparent"
                style={{ transform: [{ rotate: `${calRotation}deg` }] }}
              />
            </View>
            <Text className="text-secondary font-bold mt-2 text-sm">CALORIES</Text>
            <Text className="text-secondary font-bold">{Math.round(totalCalories)} {targetCalories ? `/ ${targetCalories}` : 'cal'}</Text>
          </TouchableOpacity>

          {/* Protein Gauge */}
          <TouchableOpacity
            className="items-center"
            onPress={() => { setCalInput(settings['target_calories'] || ''); setProInput(settings['target_protein'] || ''); setShowSettings(true); }}
          >
            <View className="w-[120px] h-[60px] overflow-hidden justify-start relative">
              <View className="absolute top-0 left-0 w-[120px] h-[120px] rounded-full border-[10px] border-secondary/20" />
              <View
                className="absolute top-0 left-0 w-[120px] h-[120px] rounded-full border-[10px] border-primary border-t-transparent border-l-transparent"
                style={{ transform: [{ rotate: `${proRotation}deg` }] }}
              />
            </View>
            <Text className="text-secondary font-bold mt-2 text-sm">PROTEIN</Text>
            <Text className="text-secondary font-bold">{Math.round(totalProtein)}g {targetProtein ? `/ ${targetProtein}g` : ''}</Text>
          </TouchableOpacity>
        </View>

        {/* Separator */}
        <View className="h-[1px] bg-border w-full mb-2" />

        {/* Logged Items List */}
        <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

          {topLevelLogs.length === 0 && emptyText && (
            <Text className="text-secondary/50 text-lg text-center mt-10">
              {emptyText}
            </Text>
          )}

          {topLevelLogs.map((item) => {
            const mealIngredients = logs.filter(log => log.parent_log_id === item.id);

            return (
              <View key={item.id}>

                {/* Standard Product Row */}
                {item.type === 'product' && (
                  <TouchableOpacity
                    onPress={() => router.push(`/log-product?id=${item.reference_id}&log_id=${item.id}&initial_grams=${item.grams_consumed}`)}
                    className="py-3 border-b border-border flex-row items-center"
                  >
                    <View className="flex-1 pr-2 justify-center">
                      <Text className="text-lg font-bold text-secondary leading-tight" numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text className="text-secondary/60 text-sm leading-tight mt-0.5">
                        {item.grams_consumed}g
                      </Text>
                    </View>

                    <View className="flex-col items-end pr-4">
                      <Text className="text-secondary">{item.calculated_calories} cal</Text>
                      <Text className="text-secondary/70 text-xs">{item.calculated_protein}g protein</Text>
                    </View>

                    <ChevronRight color="#cacbaf" size={20} />
                  </TouchableOpacity>
                )}

                {/* Meal Block */}
                {item.type === 'meal' && (
                  <TouchableOpacity
                    onPress={() => router.push(`/log-meal?id=${item.reference_id}&log_id=${item.id}`)}
                    className="border-b border-border"
                  >
                    <View className="py-3 flex-row items-center">
                      <Text className="text-lg font-bold text-secondary flex-1 pr-2" numberOfLines={1}>
                        {item.name}
                      </Text>
                      <View className="flex-col items-end pr-4">
                        <Text className="text-secondary">{item.calculated_calories} cal</Text>
                        <Text className="text-secondary/70 text-xs">{item.calculated_protein}g protein</Text>
                      </View>
                      <ChevronRight color="#cacbaf" size={20} />
                    </View>

                    {mealIngredients.length > 0 && (
                      <View className="pb-2">
                        {mealIngredients.map((ing) => (
                          <View key={ing.id} className="py-2 border-t border-border/40 flex-row items-center pl-4">
                            <CornerDownRight color="#cacbaf" opacity={0.5} size={18} style={{ marginRight: 12, marginTop: -4 }} />
                            <View className="flex-1 pr-2 justify-center">
                              <Text className="text-base font-bold text-secondary leading-tight" numberOfLines={1}>
                                {ing.name}
                              </Text>
                              <Text className="text-secondary/60 text-xs leading-tight mt-0.5">
                                {ing.grams_consumed}g
                              </Text>
                            </View>
                            <View className="flex-col items-end pr-4">
                              <Text className="text-secondary text-sm">{ing.calculated_calories} cal</Text>
                              <Text className="text-secondary/70 text-xs">{ing.calculated_protein}g protein</Text>
                            </View>
                            <View className="w-0" />
                          </View>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                )}

              </View>
            )
          })}
        </ScrollView>

        {/* Floating Action Button*/}
        <View className="absolute bottom-6 right-6 z-50 flex-row items-center">

          <Pressable
            onPress={() => router.push('/list-screen?mode=logging')}
            className="w-[72px] h-[72px] rounded-full items-center justify-center shadow-lg bg-primary"
          >
            <Plus size={48} color="black" />
          </Pressable>
        </View>

      </View>

      <Modal visible={showSettings} transparent={true} animationType="fade">
        <Pressable
          className="flex-1 justify-center items-center bg-black/50"
          onPress={() => setShowSettings(false)}
        >
          <View
            className="bg-border rounded-xl p-4 w-3/4"
            onStartShouldSetResponder={() => true}
          >
            <Text className="text-xl font-bold text-primary mb-6 text-center">Macro Targets</Text>

            <View className="flex-row items-center justify-between mb-2 mt-4">
              <Text className="text-secondary font-bold text-base">Calories</Text>
              <View className="flex-row items-center">
                <TextInput
                  value={String(calInput)}
                  onChangeText={(text) => setCalInput(text.replace(/^0+(?=\d)/, ''))}
                  keyboardType="numeric"
                  maxLength={5}
                  className={`bg-[#1A1A1A] font-bold text-base h-12 rounded-lg px-4 min-w-[60px] text-right ${(!calInput || calInput === '0') ? 'text-secondary/40' : 'text-secondary'}`}
                  style={{ includeFontPadding: false }}
                />
                <TouchableOpacity onPress={() => setCalInput('0')} className="ml-3 p-1">
                  <X color="#ef4444" size={24} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>

            <View className="h-[1px] bg-[#1A1A1A] w-full my-4" />

            <View className="flex-row items-center justify-between mb-8">
              <Text className="text-secondary font-bold text-base">Protein</Text>
              <View className="flex-row items-center">
                <View className="bg-[#1A1A1A] h-12 rounded-lg flex-row items-center justify-end px-4 min-w-[60px]">
                  <TextInput
                    value={String(proInput)}
                    onChangeText={(text) => setProInput(text.replace(/^0+(?=\d)/, ''))}
                    keyboardType="numeric"
                    maxLength={5}
                    className={`font-bold text-base text-right p-0 m-0 ${(!proInput || proInput === '0') ? 'text-secondary/50' : 'text-secondary'}`}
                    style={{ includeFontPadding: false }}
                  />
                  <Text className="text-secondary/50 text-base font-bold ml-1">g</Text>
                </View>
                <TouchableOpacity onPress={() => setProInput('0')} className="ml-3 p-1">
                  <X color="#ef4444" size={24} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Modal Actions */}
            <View className="mt-4">
              <TouchableOpacity
                className="bg-primary py-3 rounded-lg items-center w-full"
                onPress={handleSaveSettings}
              >
                <Text className="text-background font-bold text-base">Save Changes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowSettings(false)}
                className="w-full items-center py-2 mt-2"
              >
                <Text className="text-base font-bold text-secondary/60">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}