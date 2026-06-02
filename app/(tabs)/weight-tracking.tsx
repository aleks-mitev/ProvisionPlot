import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Pressable, TextInput, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, MoreVertical, Trash2, X, ListFilter, ListEnd } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Svg, { Path, Line, Circle, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { useWeightStore } from '../../store/weightStore';
import SectionDivider from '../../components/SectionDivider';

export default function WeightTrackingScreen() {
  const insets = useSafeAreaInsets();
  const { logs, contexts, loadWeightData, addLog, editLog, removeLog, addContext, removeContext, renameContext } = useWeightStore();

  useEffect(() => {
    loadWeightData();
  }, []);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };
  const [headerMenuVisible, setHeaderMenuVisible] = useState(false);
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [menuTop, setMenuTop] = useState(0);

  const [contextActionVisible, setContextActionVisible] = useState(false);
  const [tagMenuPosition, setTagMenuPosition] = useState({ x: 0, y: 0 });
  const [activeContextTag, setActiveContextTag] = useState<string | null>(null);

  const [manageContextVisible, setManageContextVisible] = useState(false);
  const [manageContextMode, setManageContextMode] = useState<'add' | 'rename'>('add');
  const [contextNameInput, setContextNameInput] = useState('');

  const [logWeightVisible, setLogWeightVisible] = useState(false);
  const [logWeightMode, setLogWeightMode] = useState<'add' | 'edit'>('add');
  const [weightInputValue, setWeightInputValue] = useState('');
  const [selectedContext, setSelectedContext] = useState<string>("");
  // Mocked edit metadata
  const [editDate, setEditDate] = useState('Today');
  const [editTime, setEditTime] = useState('08:30');

  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [editTimestamp, setEditTimestamp] = useState(new Date().toISOString());

  const weightInputRef = useRef<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const contextInputRef = useRef<TextInput>(null);

  const [timeframe, setTimeframe] = useState('2W');
  const [activeFilter, setActiveFilter] = useState('All Weight Logs');

  useEffect(() => {
    if (activeFilter !== 'All Weight Logs') {
      const tagStillExists = contexts.includes(activeFilter);
      if (!tagStillExists) {
        setActiveFilter('All Weight Logs');
      }
    }
  }, [contexts, activeFilter]);

  const stats = useMemo(() => {
    const days = timeframe === '1W' ? 7 : timeframe === '2W' ? 14 : timeframe === '4W' ? 28 : 90;

    // Anchor to the latest mock date
    const now = new Date('2026-05-26T23:59:59Z');

    const currentCutoff = new Date(now);
    currentCutoff.setDate(currentCutoff.getDate() - days);

    const previousCutoff = new Date(currentCutoff);
    previousCutoff.setDate(previousCutoff.getDate() - days);

    const filteredLogs = logs.filter(l => activeFilter === 'All Weight Logs' || l.context_tag === activeFilter);

    // Split into current period and previous period
    const currentLogs = filteredLogs.filter(l => new Date(l.timestamp) >= currentCutoff);
    const prevLogs = filteredLogs.filter(l => {
      const d = new Date(l.timestamp);
      return d >= previousCutoff && d < currentCutoff;
    });

    if (currentLogs.length === 0) return { avg: '--', trajectory: '--', fluctuation: '--', periodDelta: '--', min: 0, max: 0, currentLogs: [] };

    const currentWeights = currentLogs.map(l => l.weight);
    const currentAvgNum = currentWeights.reduce((a, b) => a + b, 0) / currentWeights.length;
    const avg = currentAvgNum.toFixed(1);
    const maxVal = Math.max(...currentWeights);
    const minVal = Math.min(...currentWeights);
    const max = maxVal.toFixed(1);
    const min = minVal.toFixed(1);

    // Sort chronologically
    const sortedCurrentLogs = [...currentLogs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Period Delta (True difference between averages)
    let deltaStr = '--';
    if (prevLogs.length > 0) {
      const prevWeights = prevLogs.map(l => l.weight);
      const prevAvgNum = prevWeights.reduce((a, b) => a + b, 0) / prevWeights.length;
      const diff = currentAvgNum - prevAvgNum;
      deltaStr = `${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg`;
    }

    // Trajectory Math
    let rateStr = '--';
    if (currentLogs.length > 1) {
      const sorted = sortedCurrentLogs;
      const oldest = sorted[0];
      const latest = sorted[sorted.length - 1];
      const weightDiff = latest.weight - oldest.weight;
      const daysDiff = (new Date(latest.timestamp).getTime() - new Date(oldest.timestamp).getTime()) / (1000 * 60 * 60 * 24);

      let rateNum = 0;
      if (daysDiff < 1) {
        rateNum = weightDiff; // If less than a day, just show the absolute change
      } else {
        rateNum = (weightDiff / daysDiff) * days;
      }

      const rateFormatted = rateNum.toFixed(2);
      rateStr = `${rateNum > 0 ? '+' : ''}${rateFormatted} kg/${timeframe.toLowerCase()}`;
    }

    return {
      avg: `${avg} kg`,
      avgNum: currentAvgNum,
      trajectory: rateStr,
      fluctuation: `${min} - ${max}`,
      periodDelta: deltaStr,
      min: minVal,
      max: maxVal,
      currentLogs: sortedCurrentLogs
    };
  }, [logs, timeframe, activeFilter]);

  useEffect(() => {
    if (logWeightVisible && logWeightMode === 'add') {
      setTimeout(() => {
        weightInputRef.current?.focus();
      }, 100);
    }
  }, [logWeightVisible, logWeightMode]);

  useEffect(() => {
    if (manageContextVisible) {
      setTimeout(() => contextInputRef.current?.focus(), 100);
    }
  }, [manageContextVisible]);

  const openLogWeightModal = (mode: 'add' | 'edit', currentWeight = '', currentContext = '', timestamp?: string) => {
    setLogWeightMode(mode);
    setWeightInputValue(currentWeight);
    if (mode === 'add') {
      setSelectedContext(activeFilter !== 'All Weight Logs' ? activeFilter : "");
    } else {
      setSelectedContext(currentContext);
    }
    setEditTimestamp(timestamp || new Date().toISOString());
    setLogWeightVisible(true);
  };

  const handlePickerChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShowPicker(false);
      return;
    }
    if (selectedDate) {
      const currentDate = new Date(editTimestamp);
      if (pickerMode === 'date') {
        currentDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        setEditTimestamp(currentDate.toISOString());
        setPickerMode('time');
        if (Platform.OS === 'android') {
          setShowPicker(false);
          setTimeout(() => setShowPicker(true), 50);
        }
      } else {
        currentDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
        setEditTimestamp(currentDate.toISOString());
        setShowPicker(false);
      }
    }
  };

  const openContextAction = (tag: string, event: any) => {
    setActiveContextTag(tag);
    const { pageX, pageY } = event.nativeEvent;
    const screenWidth = Dimensions.get('window').width;
    const menuWidth = 160;

    let safeX = pageX;
    if (pageX + menuWidth > screenWidth) {
      safeX = screenWidth - menuWidth - 16;
    }

    setTagMenuPosition({ x: safeX, y: pageY + 10 });
    setContextActionVisible(true);
  };

  const openManageContext = (mode: 'add' | 'rename', currentName = '') => {
    setManageContextMode(mode);
    setContextNameInput(currentName);
    setManageContextVisible(true);
  };

  const openActionMenu = (log: any, event: any) => {
    setSelectedLog(log);
    setMenuTop(event.nativeEvent.pageY + 10);
    setActionMenuVisible(true);
  };

  const handleDeleteLog = () => {
    if (selectedLog) {
      removeLog(selectedLog.id);
    }
    setActionMenuVisible(false);
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(l => activeFilter === 'All Weight Logs' || l.context_tag === activeFilter);
  }, [logs, activeFilter]);

  const GRAPH_DRAWABLE_HEIGHT = 260;
  const GRAPH_HEIGHT = 280;
  const GRAPH_WIDTH = Math.max((stats.currentLogs?.length || 0) * 60, 300);

  let pathD = '';
  let gradientPathD = '';
  const points: { x: number, y: number }[] = [];

  const minW = stats.currentLogs?.length > 0 ? Number(stats.min) : 0;
  const maxW = stats.currentLogs?.length > 0 ? Number(stats.max) : 0;
  const avgNum = stats.currentLogs?.length > 0 ? Number(stats.avgNum) : 0;

  const graphMax = Math.ceil(maxW);
  const graphMin = Math.floor(minW);
  const yRange = graphMax - graphMin === 0 ? 1 : graphMax - graphMin;

  if (stats.currentLogs && stats.currentLogs.length > 0) {
    stats.currentLogs.forEach((log, index) => {
      const x = stats.currentLogs.length === 1 ? GRAPH_WIDTH / 2 : (index / (stats.currentLogs.length - 1)) * (GRAPH_WIDTH - 40) + 20;
      const normalizedY = (graphMax - log.weight) / yRange;
      const y = normalizedY * GRAPH_DRAWABLE_HEIGHT;

      points.push({ x, y });
      if (index === 0) {
        pathD += `M ${x} ${y} `;
      } else {
        pathD += `L ${x} ${y} `;
      }
    });

    if (points.length > 0) {
      gradientPathD = `${pathD} L ${points[points.length - 1].x} ${GRAPH_DRAWABLE_HEIGHT} L ${points[0].x} ${GRAPH_DRAWABLE_HEIGHT} Z`;
    }
  }

  const yAxisTicks = [];
  for (let i = graphMin; i <= graphMax; i++) {
    yAxisTicks.push(i);
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      {/* Dynamic Header */}
      <View className="h-[68px] border-b border-border justify-center items-center">
        <TouchableOpacity
          className="relative flex-row items-center justify-center py-2 w-full"
          onPress={() => setHeaderMenuVisible(true)}
        >
          <Text className="text-secondary text-3xl font-bold text-center">
            {activeFilter === 'All Weight Logs' ? 'Weight Logs' : activeFilter}
          </Text>
          <View className="absolute right-4 opacity-50">
            <ListEnd color="#cacbaf" size={24} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Timeframe Toggle */}
        <View className="flex-row mx-4 mt-4 mb-6 bg-border/30 p-1 rounded-xl border border-border/50">
          {['1W', '2W', '4W', '3M'].map(tf => (
            <TouchableOpacity
              key={tf}
              onPress={() => setTimeframe(tf)}
              className={`flex-1 py-2 items-center rounded-lg ${timeframe === tf ? 'bg-primary' : ''}`}
            >
              <Text className={`font-bold text-xs ${timeframe === tf ? 'text-background' : 'text-secondary/50'}`}>
                {tf}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Trend Graph */}
        <View className="flex-row items-start mb-6 pl-2 pr-4">
          {/* Fixed Y-Axis */}
          <View className="w-10 h-[260px] relative">
            {/* Muted Integers */}
            {stats.currentLogs && stats.currentLogs.length > 0 && yAxisTicks.map(tick => {
              const topPercent = ((graphMax - tick) / yRange) * 100;
              return (
                <Text
                  key={`tick-${tick}`}
                  className="text-secondary/30 text-[10px] absolute w-full text-right pr-2 -translate-y-2"
                  style={{ top: `${topPercent}%` }}
                >
                  {tick}
                </Text>
              );
            })}

            {/* Golden Exact Values */}
            {stats.currentLogs && stats.currentLogs.length > 0 && (
              <>
                {/* Max */}
                <Text
                  className="text-primary font-bold text-[10px] absolute w-full text-right pr-2 -translate-y-2"
                  style={{ top: `${((graphMax - maxW) / yRange) * 100}%` }}
                >
                  {maxW.toFixed(1)}
                </Text>

                {/* Avg */}
                <Text
                  className="text-primary font-bold text-[10px] absolute w-full text-right pr-2 -translate-y-2"
                  style={{ top: `${((graphMax - avgNum) / yRange) * 100}%` }}
                >
                  {avgNum.toFixed(1)}
                </Text>

                {/* Min */}
                <Text
                  className="text-primary font-bold text-[10px] absolute w-full text-right pr-2 -translate-y-2"
                  style={{ top: `${((graphMax - minW) / yRange) * 100}%` }}
                >
                  {minW.toFixed(1)}
                </Text>
              </>
            )}
          </View>

          {/* Scrolling X-Axis / Graph */}
          <View className="flex-1">
            <ScrollView
              key={`${timeframe}-${activeFilter}`}
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-1"
              contentContainerStyle={{ flexGrow: 1 }}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
            >
              {stats.currentLogs && stats.currentLogs.length > 0 ? (
                <View style={{ width: GRAPH_WIDTH, height: GRAPH_HEIGHT }}>
                  <Svg style={{ flex: 1 }} viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}>
                    <Defs>
                      <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#d89b22" stopOpacity="0.3" />
                        <Stop offset="1" stopColor="#d89b22" stopOpacity="0" />
                      </LinearGradient>
                    </Defs>

                    {/* Grid Lines */}
                    {stats.currentLogs && stats.currentLogs.length > 0 && (
                      <>
                        <Line x1="0" y1={((graphMax - maxW) / yRange) * GRAPH_DRAWABLE_HEIGHT} x2={GRAPH_WIDTH} y2={((graphMax - maxW) / yRange) * GRAPH_DRAWABLE_HEIGHT} stroke="#d89b22" strokeWidth="0.5" strokeDasharray="4 4" strokeOpacity="0.5" />
                        <Line x1="0" y1={((graphMax - avgNum) / yRange) * GRAPH_DRAWABLE_HEIGHT} x2={GRAPH_WIDTH} y2={((graphMax - avgNum) / yRange) * GRAPH_DRAWABLE_HEIGHT} stroke="#d89b22" strokeWidth="0.5" strokeDasharray="4 4" strokeOpacity="0.5" />
                        <Line x1="0" y1={((graphMax - minW) / yRange) * GRAPH_DRAWABLE_HEIGHT} x2={GRAPH_WIDTH} y2={((graphMax - minW) / yRange) * GRAPH_DRAWABLE_HEIGHT} stroke="#d89b22" strokeWidth="0.5" strokeDasharray="4 4" strokeOpacity="0.5" />
                        {/* Subdued integer lines */}
                        {yAxisTicks.map(tick => {
                          const yPos = ((graphMax - tick) / yRange) * GRAPH_DRAWABLE_HEIGHT;
                          return <Line key={`grid-${tick}`} x1="0" y1={yPos} x2={GRAPH_WIDTH} y2={yPos} stroke="#cacbaf" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="4, 4" />;
                        })}
                      </>
                    )}

                    {/* Fill Gradient */}
                    {points.length > 1 && (
                      <Path d={gradientPathD} fill="url(#gradient)" />
                    )}

                    {/* Path Line */}
                    {points.length > 1 && (
                      <Path
                        d={pathD}
                        fill="none"
                        stroke="#d89b22"
                        strokeWidth="3"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    )}

                    {/* Data Points and X-Axis Labels */}
                    {points.map((point, i) => (
                      <React.Fragment key={i}>
                        <Circle cx={point.x} cy={point.y} r="4" fill="#1E1E1E" stroke="#d89b22" strokeWidth="2" />
                        <SvgText
                          x={point.x}
                          y={point.y - 12}
                          fill="#cacbaf"
                          fontSize="11"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {stats.currentLogs[i].weight}
                        </SvgText>
                        <SvgText
                          x={point.x}
                          y={GRAPH_HEIGHT - 5}
                          fill="#cacbaf"
                          opacity="0.5"
                          fontSize="9"
                          textAnchor="middle"
                        >
                          {formatDate(stats.currentLogs[i].timestamp)}
                        </SvgText>
                      </React.Fragment>
                    ))}
                  </Svg>
                </View>
              ) : (
                <View className="h-[260px] items-center justify-center" style={{ width: 300 }}>
                  <Text className="text-secondary/40">No data for this timeframe</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>

        {/* 2x2 Stats Grid */}
        <View className="flex-row flex-wrap justify-between px-4 mb-6 gap-y-3">
          {/* Average */}
          <View className="w-[48%] bg-border/20 p-4 rounded-2xl border border-border/50">
            <Text className="text-secondary/50 text-[10px] font-bold tracking-widest uppercase mb-1">Average</Text>
            <Text className="text-secondary text-xl font-bold" numberOfLines={1} adjustsFontSizeToFit>{stats.avg}</Text>
          </View>

          {/* Fluctuation */}
          <View className="w-[48%] bg-border/20 p-4 rounded-2xl border border-border/50">
            <Text className="text-secondary/50 text-[10px] font-bold tracking-widest uppercase mb-1">Fluctuation</Text>
            <Text className="text-secondary text-xl font-bold" numberOfLines={1} adjustsFontSizeToFit>{stats.fluctuation}</Text>
          </View>

          {/* VS Prev Avg */}
          <View className="w-[48%] bg-border/20 p-4 rounded-2xl border border-border/50 justify-center">
            <Text className="text-secondary/50 text-[10px] font-bold tracking-widest uppercase mb-1">VS PREV {timeframe} AVG</Text>
            <Text className="text-secondary text-xl font-bold" numberOfLines={1} adjustsFontSizeToFit>{stats.periodDelta}</Text>
          </View>

          {/* Trajectory */}
          <View className="w-[48%] bg-border/20 p-4 rounded-2xl border border-border/50">
            <Text className="text-secondary/50 text-[10px] font-bold tracking-widest uppercase mb-1">Trajectory</Text>
            <Text className="text-secondary text-xl font-bold" numberOfLines={1} adjustsFontSizeToFit>{stats.trajectory}</Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          className="bg-primary rounded-xl py-4 mx-4 items-center"
          onPress={() => openLogWeightModal('add')}
        >
          <Text className="text-background text-lg font-bold">LOG WEIGHT</Text>
        </TouchableOpacity>

        {/* Minimal History List */}
        <SectionDivider label="Previous Weight Logs" />

        {/* Dummy Data Rows */}
        {filteredLogs.length === 0 ? (
          <View className="items-center justify-center py-8">
            <Text className="text-secondary/50 text-sm tracking-wider">No logs</Text>
          </View>
        ) : (
          filteredLogs.map((log) => (
            <View key={log.id} className="flex-row justify-between items-center py-3 border-b border-border mx-4">

              {/* LEFT SIDE (Weight + Tag) - flex-1 forces it to stop at the right side's boundary */}
              <View className="flex-1 flex-row items-center mr-2 pr-2">
                <Text className="text-secondary text-xl font-bold">{log.weight} kg</Text>

                {/* Tag Chip - flex-shrink allows it to compress, overflow-hidden keeps it clean */}
                {log.context_tag !== '' && (
                  <View className="flex-shrink ml-3 border border-border rounded-md px-2 py-0.5 overflow-hidden">
                    <Text
                      className="text-[10px] text-primary uppercase tracking-wide"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {log.context_tag}
                    </Text>
                  </View>
                )}
              </View>

              {/* RIGHT SIDE (Date + Menu) - flex-shrink-0 acts as a brick wall, never compressing */}
              <View className="flex-row items-center flex-shrink-0">
                <View className="flex-col items-end mr-3">
                  <Text className="text-sm font-medium text-secondary">{formatDate(log.timestamp)}</Text>
                  <Text className="text-sm font-medium text-secondary">{formatTime(log.timestamp)}</Text>
                </View>
                <TouchableOpacity className="p-1" onPress={(e) => openActionMenu(log, e)}>
                  <MoreVertical color="#cacbaf" size={20} />
                </TouchableOpacity>
              </View>

            </View>
          ))
        )}
      </ScrollView>

      {/* Dropdown Menu Modal */}
      <Modal transparent visible={actionMenuVisible} animationType="fade">
        <Pressable className="flex-1 bg-black/50" onPress={() => setActionMenuVisible(false)}>
          <View className="absolute right-6 bg-background rounded-md border border-border shadow-xl overflow-hidden w-36" style={{ top: menuTop }}>
            <TouchableOpacity className="py-3 pl-4 pr-2 border-b border-border" onPress={() => { setActionMenuVisible(false); openLogWeightModal('edit', selectedLog?.weight?.toString(), selectedLog?.context_tag || "", selectedLog?.timestamp); }}>
              <Text className="text-secondary font-medium text-base text-left">Edit Record</Text>
            </TouchableOpacity>
            <TouchableOpacity className="py-3 pl-4 pr-2" onPress={handleDeleteLog}>
              <Text className="text-[#ff4444] font-medium text-base text-left">Delete Record</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <Modal transparent visible={headerMenuVisible} animationType="fade">
        <Pressable className="flex-1 bg-black/50" onPress={() => setHeaderMenuVisible(false)}>
          {/* Centered Floating Menu */}
          <View className="absolute top-14 self-center bg-background border border-border rounded-xl shadow-2xl overflow-hidden w-64">
            {/* Default Option */}
            <TouchableOpacity className={`py-4 pl-6 pr-4 border-b border-border ${activeFilter === 'All Weight Logs' ? 'bg-border/30' : ''}`} onPress={() => { setActiveFilter('All Weight Logs'); setHeaderMenuVisible(false); }}>
              <Text className={`${activeFilter === 'All Weight Logs' ? 'text-primary' : 'text-secondary'} font-bold text-lg text-left`}>All Weight Logs</Text>
            </TouchableOpacity>

            {/* Dynamic Context Tags */}
            {contexts.map((tag) => (
              <TouchableOpacity key={tag} className={`py-4 pl-6 pr-4 border-b border-border ${activeFilter === tag ? 'bg-border/30' : ''}`} onPress={() => { setActiveFilter(tag); setHeaderMenuVisible(false); }} onLongPress={(e) => openContextAction(tag, e)}>
                <Text className={`${activeFilter === tag ? 'text-primary' : 'text-secondary'} font-medium text-lg text-left`}>{tag}</Text>
              </TouchableOpacity>
            ))}

            {/* Add New Context Action (Left aligned now) */}
            <TouchableOpacity className="py-4 pl-6 pr-4" onPress={() => openManageContext('add')}>
              <Text className="text-secondary/60 font-medium text-lg text-left">+ Add New Context</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Log Weight Input Modal */}
      <Modal transparent visible={logWeightVisible} animationType="slide" statusBarTranslucent>
        <Pressable className="flex-1 justify-end bg-black/50" onPress={() => setLogWeightVisible(false)}>
          <Pressable
            className="bg-background w-full border-t border-border rounded-t-2xl p-6"
            style={{ height: 600, paddingBottom: Math.max(insets.bottom, 16) + 24 }}
            onPress={(e) => e.stopPropagation()}
          >

            {/* Header */}
            <View className="flex-row items-center justify-center mb-8 relative">
              <TouchableOpacity
                className="absolute right-0 p-2 opacity-50"
                onPress={() => setLogWeightVisible(false)}
              >
                <X color="#cacbaf" size={24} />
              </TouchableOpacity>
              <Text className="text-secondary text-xl font-bold text-center">
                {logWeightMode === 'add' ? 'Log Weight' : 'Edit Weight'}
              </Text>
            </View>

            {/* Massive Input Area */}
            <View className={`flex-row ${logWeightMode === 'edit' ? 'items-stretch justify-between' : 'justify-center'} mb-6`}>
              {/* Main Weight Input */}
              <Pressable
                onPress={() => weightInputRef.current?.focus()}
                className={`flex-row items-baseline bg-border/30 px-8 py-4 rounded-3xl border border-border/50 ${logWeightMode === 'edit' ? 'flex-1 mr-4 justify-center' : ''}`}
              >
                <TextInput
                  ref={weightInputRef}
                  className="text-secondary text-7xl font-bold p-0 m-0 text-center"
                  style={{ includeFontPadding: false, height: 80 }}
                  keyboardType="decimal-pad"
                  placeholder="0.0"
                  placeholderTextColor="#cacbaf30"
                  value={weightInputValue}
                  onChangeText={setWeightInputValue}
                />
                <Text className="text-secondary/50 text-3xl font-medium ml-3" style={{ includeFontPadding: false }}>
                  kg
                </Text>
              </Pressable>

              {/* NEW SIDE-BY-SIDE DATE/TIME COLUMN (ONLY ON EDIT) */}
              {logWeightMode === 'edit' && selectedLog && (
                <View className="w-28 flex-col justify-between gap-3">
                  <TouchableOpacity
                    onPress={() => { setPickerMode('date'); setShowPicker(true); }}
                    className="flex-1 bg-border/30 border border-border/50 rounded-2xl justify-center items-center"
                  >
                    <Text className="text-secondary font-bold text-sm">{formatDate(editTimestamp)}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => { setPickerMode('time'); setShowPicker(true); }}
                    className="flex-1 bg-border/30 border border-border/50 rounded-2xl justify-center items-center"
                  >
                    <Text className="text-secondary font-bold text-sm">{formatTime(editTimestamp)}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>



            {/* Context Separator */}
            <SectionDivider label="Context Tags" />

            {/* Context Chips (Wrapping Container) */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              className="w-full mb-1"
              style={{ maxHeight: 210 }}
              contentContainerStyle={{ paddingBottom: 8 }}
            >
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {contexts.map((tag) => {
                  const isActive = selectedContext === tag;
                  return (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => setSelectedContext(selectedContext === tag ? "" : tag)}
                      onLongPress={(e) => openContextAction(tag, e)}
                      className={`border rounded-full px-4 py-2 ${isActive ? 'border-primary bg-primary/10' : 'border-border bg-[#151515]'}`}
                    >
                      <Text className={`text-xs uppercase tracking-wide ${isActive ? 'text-primary' : 'text-secondary/70'}`}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View className="mt-3 flex-row">
                <TouchableOpacity
                  className="border border-dashed border-border rounded-full bg-[#151515] px-4 py-2"
                  onPress={() => openManageContext('add')}
                >
                  <Text className="text-secondary/50 text-xs uppercase tracking-wide">+ Add New Context</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* KEYBOARD TUNING SPACER: Increased to h-32 to push input higher */}
            <View style={{ flex: 1 }} />

            {/* Save Button */}
            <TouchableOpacity
              className="bg-primary rounded-xl py-4 items-center"
              onPress={() => {
                const weight = parseFloat(weightInputValue);
                if (!isNaN(weight)) {
                  const timestamp = editTimestamp;
                  const tag = selectedContext;
                  if (logWeightMode === 'add') {
                    addLog(weight, timestamp, tag);
                  } else if (selectedLog) {
                    editLog(selectedLog.id, weight, timestamp, tag);
                  }
                }
                setLogWeightVisible(false);
              }}
            >
              <Text className="text-background text-lg font-bold">SAVE</Text>
            </TouchableOpacity>

          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent visible={contextActionVisible} animationType="fade">
        <Pressable className="flex-1 bg-black/50" onPress={() => setContextActionVisible(false)}>
          <View
            className="absolute bg-[#1A1A1A] border border-border rounded-xl overflow-hidden w-40 shadow-lg shadow-black"
            style={{ top: tagMenuPosition.y, left: tagMenuPosition.x }}
          >
            <TouchableOpacity
              className="p-4 border-b border-border"
              onPress={() => { setContextActionVisible(false); openManageContext('rename', activeContextTag || ''); }}
            >
              <Text className="text-secondary font-medium text-base">Rename</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="p-4"
              onPress={() => { if (activeContextTag) removeContext(activeContextTag); setContextActionVisible(false); }}
            >
              <Text className="text-red-500 font-medium text-base">Delete</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <Modal transparent visible={manageContextVisible} animationType="slide">
        <Pressable className="flex-1 justify-end bg-black/50" onPress={() => setManageContextVisible(false)}>
          <Pressable className="bg-background w-full border-t border-border rounded-t-2xl p-6 pb-12" onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View className="flex-row items-center justify-center mb-6 relative">
              <TouchableOpacity
                className="absolute right-0 p-2 opacity-50"
                onPress={() => setManageContextVisible(false)}
              >
                <X color="#cacbaf" size={24} />
              </TouchableOpacity>
              <Text className="text-secondary text-xl font-bold text-center">
                {manageContextMode === 'add' ? 'Add Context Tag' : 'Rename Context Tag'}
              </Text>
            </View>

            <TextInput
              ref={contextInputRef}
              className="bg-[#1A1A1A] border border-border rounded-lg text-secondary text-lg px-4 py-4 mb-6"
              placeholder="e.g. Waking/Depleted"
              placeholderTextColor="#cacbaf50"
              value={contextNameInput}
              onChangeText={setContextNameInput}
            />

            <TouchableOpacity
              className="bg-primary rounded-xl py-4 items-center"
              onPress={() => {
                if (manageContextMode === 'add' && contextNameInput) {
                  addContext(contextNameInput);
                } else if (manageContextMode === 'rename' && activeContextTag && contextNameInput) {
                  renameContext(activeContextTag, contextNameInput);
                }
                setManageContextVisible(false);
              }}
            >
              <Text className="text-background text-lg font-bold">SAVE</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {showPicker && (
        <DateTimePicker
          value={new Date(editTimestamp)}
          mode={pickerMode}
          display="default"
          maximumDate={new Date()}
          onChange={handlePickerChange}
        />
      )}
    </SafeAreaView>
  );
}
