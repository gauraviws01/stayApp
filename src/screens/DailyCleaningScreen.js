import React, {useCallback, useEffect, useMemo, useState} from 'react';

import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Video from 'react-native-video';
import Svg, {Path} from 'react-native-svg';
import {useFocusEffect} from '@react-navigation/native';

import PropertyDropdown from '../components/PropertyDropdown';

const PRIMARY = '#17B978';
const BACKGROUND = '#F4F8F5';

const fallbackProperties = [
  'Sereno Greens - Cosy 1 BHK with Pvt Balcony',
  'Sereno Horizon 3bhk Penthouse pvt jacuzzi rooftop',
  'Sereno Foresta cosy 1 bhk greenery view w/pool+game',
  'Sereno Blossom - luxury 1bhk w/pool near Baga',
];

const ROOMS_STORAGE_KEY = 'dailyCleaningRooms';
const DEFAULT_SECTIONS = [
  {title: 'Standard room', description: 'Standard room cleaning checklist'},
  {title: 'Deluxe room', description: 'Deluxe room cleaning checklist'},
  {title: 'Test room', description: 'Test room cleaning checklist'},
];

const getDateKey = date => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getCalendarDays = monthDate => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const cells = Array.from({length: firstDay.getDay()}, () => null);

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    cells.push(new Date(year, month, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
};

const getRoomMedia = room => {
  if (Array.isArray(room?.media)) {
    return room.media;
  }

  return room?.mediaUri
    ? [{uri: room.mediaUri, type: room.mediaType || 'photo', fileName: room.mediaName || 'Uploaded file'}]
    : [];
};

const CalendarIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path
      d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
      stroke="#287954"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const DailyCleaningScreen = ({navigation}) => {
  const [selectedProperty, setSelectedProperty] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [savedRooms, setSavedRooms] = useState([]);
  const [activeMedia, setActiveMedia] = useState(null);
  const [activeMediaItem, setActiveMediaItem] = useState(null);
  const [videoAspectRatio, setVideoAspectRatio] = useState(16 / 9);

  const todayKey = getDateKey(new Date());
  const calendarDates = useMemo(() => getCalendarDays(calendarMonth), [calendarMonth]);

  const loadRooms = useCallback(async () => {
    try {
      const storedRooms = await AsyncStorage.getItem(ROOMS_STORAGE_KEY);
      setSavedRooms(storedRooms ? JSON.parse(storedRooms) : []);
    } catch (error) {
      setSavedRooms([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRooms();
    }, [loadRooms]),
  );

  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(todayKey);
    }
  }, [selectedDate, todayKey]);

  const isPastDate = selectedDate < todayKey;

  const getRoomForSection = section =>
    savedRooms.find(
      room =>
        room.property === selectedProperty &&
        room.date === selectedDate &&
        room.title === section.title,
    );

  const openAddRoom = section => {
    if (!selectedProperty) {
      Alert.alert('Select property', 'Please select a property first.');
      return;
    }

    if (!selectedDate || isPastDate) {
      return;
    }

    navigation.navigate('AddRoom', {
      property: selectedProperty,
      date: selectedDate,
      sectionTitle: section.title,
    });
  };

  const openEditRoom = room => {
    if (!selectedProperty) {
      Alert.alert('Select property', 'Please select a property first.');
      return;
    }

    navigation.navigate('EditRoom', {room});
  };

  const handleSelectDate = date => {
    if (!date) {
      return;
    }

    if (!selectedProperty) {
      Alert.alert('Select property', 'Please select a property first.');
      return;
    }

    const dateKey = getDateKey(date);
    if (dateKey > todayKey) {
      return;
    }

    setSelectedDate(dateKey);
    setCalendarVisible(false);
  };

  const displayDate = selectedDate
    ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Select date';

  const openRoomMedia = room => {
    const mediaItems = getRoomMedia(room);
    const video = mediaItems.find(item => item.type === 'video');
    setVideoAspectRatio(video?.width && video?.height ? video.width / video.height : 16 / 9);
    setActiveMediaItem(video || mediaItems[0] || null);
    setActiveMedia(room);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <View style={styles.propertyDropdownWrap}>
          <PropertyDropdown
            selectedValue={selectedProperty}
            selectedLabel={selectedProperty || undefined}
            fallbackProperties={fallbackProperties}
            onChange={property => setSelectedProperty(property)}
          />
        </View>

        <Text style={styles.dateLabel}>DATE</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.dateInput}
          onPress={() => setCalendarVisible(true)}>
          <Text style={styles.dateInputText}>{displayDate}</Text>
          <CalendarIcon />
        </TouchableOpacity>

        <View style={styles.roomsHeader}>
          <Text style={styles.sectionLabel}>SECTIONS</Text>
        </View>

        {DEFAULT_SECTIONS.map(section => {
          const room = getRoomForSection(section);

          return (
          <View key={section.title} style={styles.roomCard}>
            <View style={styles.roomHeaderRow}>
              <View style={styles.roomHeadingWrap}>
                <Text style={styles.roomTitle}>{section.title}</Text>
              </View>
              {!room && !isPastDate && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.addRoomButton}
                  onPress={() => openAddRoom(section)}>
                  <Text style={styles.addRoomText}>+ Add</Text>
                </TouchableOpacity>
              )}
            </View>

            {room && <>
            <Text style={styles.roomComment}>{room.description}</Text>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.mediaPreview}
              onPress={() => openRoomMedia(room)}>
              <View style={styles.mediaTint} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaListPreview}>
                {getRoomMedia(room).map((item, index) => (
                  <View key={`${item.uri}-${index}`} style={styles.mediaItemPreview}>
                    {item.type === 'photo' ? (
                      <Image source={{uri: item.uri}} style={styles.mediaImage} />
                    ) : (
                      <View style={styles.videoThumbnail}>
                        <Video
                          source={{uri: item.uri}}
                          style={styles.videoThumbnailImage}
                          resizeMode="cover"
                          paused
                          muted
                        />
                        <View style={styles.videoPreviewIcon}>
                          <Text style={styles.playIcon}>▶</Text>
                        </View>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            </TouchableOpacity>

            <View style={styles.roomDivider} />
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.editButton}
              onPress={() => openEditRoom(room)}>
              <Text style={styles.editIcon}>⌕</Text>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
            </>}
          </View>
          );
        })}

        {!selectedProperty && (
          <Text style={styles.emptyRoomsText}>
            Select a property to view its cleaning sections.
          </Text>
        )}
      </ScrollView>

      <Modal
        visible={calendarVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarVisible(false)}>
        <Pressable
          style={styles.calendarBackdrop}
          onPress={() => setCalendarVisible(false)}>
          <Pressable style={styles.calendarModal} onPress={event => event.stopPropagation()}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.dateArrow}
                onPress={() =>
                  setCalendarMonth(
                    month => new Date(month.getFullYear(), month.getMonth() - 1, 1),
                  )
                }>
                <Text style={styles.dateArrowText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.calendarTitle}>
                {calendarMonth.toLocaleDateString('en-US', {month: 'long', year: 'numeric'})}
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.dateArrow}
                disabled={
                  calendarMonth.getFullYear() > new Date().getFullYear() ||
                  (calendarMonth.getFullYear() === new Date().getFullYear() &&
                    calendarMonth.getMonth() >= new Date().getMonth())
                }
                onPress={() =>
                  setCalendarMonth(
                    month => new Date(month.getFullYear(), month.getMonth() + 1, 1),
                  )
                }>
                <Text style={styles.dateArrowText}>›</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.weekdayRow}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Text key={day} style={styles.weekdayText}>{day}</Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {calendarDates.map((date, index) => {
                if (!date) {
                  return <View key={`empty-${index}`} style={styles.dayCellEmpty} />;
                }

                const dateKey = getDateKey(date);
                const isSelected = dateKey === selectedDate;
                const isFuture = dateKey > todayKey;

                return (
                  <TouchableOpacity
                    key={dateKey}
                    activeOpacity={0.8}
                    disabled={isFuture}
                    onPress={() => handleSelectDate(date)}
                    style={[styles.dayCell, isSelected && styles.dayCellSelected, isFuture && styles.dayCellDisabled]}>
                    <Text style={[styles.dayText, isSelected && styles.dayTextSelected, isFuture && styles.dayTextDisabled]}>
                      {date.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity activeOpacity={0.9} style={styles.doneButton} onPress={() => setCalendarVisible(false)}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={Boolean(activeMedia)}
        transparent
        animationType="fade"
        onRequestClose={() => { setActiveMedia(null); setActiveMediaItem(null); }}>
        <Pressable style={styles.modalBackdrop} onPress={() => { setActiveMedia(null); setActiveMediaItem(null); }}>
          <Pressable style={styles.mediaModal} onPress={event => event.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{activeMedia?.title}</Text>
              <TouchableOpacity onPress={() => { setActiveMedia(null); setActiveMediaItem(null); }}>
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>
            </View>
            {activeMediaItem?.type === 'video' ? (
              <Video
                source={{
                  uri:
                    activeMediaItem.uri ||
                    'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
                }}
                style={[styles.video, {aspectRatio: videoAspectRatio}]}
                resizeMode="contain"
                controls
                paused={!activeMedia}
                onLoad={event => {
                  const naturalSize = event?.naturalSize;
                  if (naturalSize?.width && naturalSize?.height) {
                    setVideoAspectRatio(naturalSize.width / naturalSize.height);
                  }
                }}
              />
            ) : (
              <Image
                source={{uri: activeMediaItem?.uri}}
                style={styles.video}
                resizeMode="contain"
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default DailyCleaningScreen;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: BACKGROUND},
  content: {padding: 16, paddingBottom: 32},
  titleRow: {marginBottom: 26},
  eyebrow: {fontSize: 11, fontWeight: '800', letterSpacing: 1.5, color: '#7C9489'},
  title: {fontSize: 25, fontWeight: '800', color: '#173A30', marginTop: 6},
  subtitle: {fontSize: 13, color: '#82958C', marginTop: 4},
  propertyDropdownWrap: {marginBottom: 24},
  sectionLabel: {fontSize: 11, fontWeight: '800', letterSpacing: 1.5, color: '#849890'},
  dateLabel: {fontSize: 11, fontWeight: '800', letterSpacing: 1.5, color: '#849890', marginBottom: 8},
  dateInput: {height: 54, borderWidth: 1, borderColor: '#D9E5DE', borderRadius: 13, backgroundColor: '#FFFFFF', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24},
  dateInputText: {fontSize: 15, fontWeight: '700', color: '#173A30'},
  calendarBackdrop: {flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.32)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 18},
  calendarModal: {width: '100%', maxWidth: 420, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, elevation: 10, shadowColor: '#000', shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.15, shadowRadius: 15},
  calendarHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14},
  calendarTitle: {fontSize: 16, fontWeight: '800', color: '#1F2D2A'},
  weekdayRow: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10},
  weekdayText: {flex: 1, textAlign: 'center', fontSize: 11, color: '#6E8B84', fontWeight: '700'},
  calendarGrid: {flexDirection: 'row', flexWrap: 'wrap'},
  dateArrow: {width: 34, height: 34, borderRadius: 17, backgroundColor: '#EAF7F3', alignItems: 'center', justifyContent: 'center'},
  dateArrowText: {fontSize: 22, color: '#113B32', fontWeight: '700'},
  dayCell: {width: '14.285%', height: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderRadius: 10},
  dayCellSelected: {backgroundColor: '#17B978'},
  dayCellDisabled: {opacity: 0.35},
  dayCellEmpty: {width: '14.285%', height: 40},
  dayText: {fontSize: 14, fontWeight: '700', color: '#1F2D2A'},
  dayTextSelected: {color: '#FFFFFF'},
  dayTextDisabled: {color: '#A0AAA7'},
  doneButton: {marginTop: 14, backgroundColor: '#EAF7F3', borderRadius: 12, paddingVertical: 12, alignItems: 'center'},
  doneButtonText: {fontSize: 15, fontWeight: '800', color: '#114433'},
  roomsHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 2},
  roomHeaderRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  roomHeadingWrap: {flex: 1, paddingRight: 10},
  addRoomButton: {borderWidth: 1, borderColor: '#CFE6D9', backgroundColor: '#F8FCF9', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8},
  addRoomText: {fontSize: 12, color: '#287954', fontWeight: '700'},
  roomCard: {backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE8E1', borderRadius: 17, padding: 16, marginTop: 12},
  roomTitle: {fontSize: 15, fontWeight: '800', color: '#173A30'},
  roomDescription: {fontSize: 11, color: '#82958C', marginTop: 5},
  roomComment: {fontSize: 13, lineHeight: 19, color: '#536B60', marginTop: 5},
  mediaPreview: {width: '100%', height: 72, borderRadius: 11, overflow: 'hidden', backgroundColor: '#DCECE4', marginTop: 14, justifyContent: 'center'},
  mediaListPreview: {paddingHorizontal: 6, alignItems: 'center'},
  mediaItemPreview: {width: 60, height: 60, borderRadius: 9, overflow: 'hidden', backgroundColor: '#AFCFC0', marginHorizontal: 4, alignItems: 'center', justifyContent: 'center'},
  videoThumbnail: {width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center'},
  videoThumbnailImage: {position: 'absolute', width: '100%', height: '100%'},
  mediaTint: {position: 'absolute', inset: 0, backgroundColor: '#AFCFC0'},
  mediaImage: {width: '100%', height: '100%', resizeMode: 'cover'},
  videoPreviewIcon: {width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center'},
  mediaType: {fontSize: 9, fontWeight: '800', letterSpacing: 1, color: '#FFFFFF', zIndex: 1},
  playButton: {position: 'absolute', right: 6, bottom: 6, width: 21, height: 21, borderRadius: 11, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', zIndex: 1},
  playIcon: {fontSize: 9, color: PRIMARY, marginLeft: 2},
  roomDivider: {height: 1, backgroundColor: '#E5EEE9', marginTop: 12},
  editButton: {alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D0E5D8', backgroundColor: '#F8FCF9', borderRadius: 17, paddingHorizontal: 13, paddingVertical: 8, marginTop: 12},
  editIcon: {fontSize: 16, color: '#287954', marginRight: 6},
  editText: {fontSize: 12, fontWeight: '700', color: '#287954'},
  emptyRoomsText: {fontSize: 13, color: '#82958C', paddingVertical: 24},
  modalBackdrop: {flex: 1, backgroundColor: 'rgba(12, 30, 24, 0.72)', justifyContent: 'center', padding: 18},
  mediaModal: {backgroundColor: '#FFFFFF', borderRadius: 18, overflow: 'hidden'},
  modalHeader: {minHeight: 55, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  modalTitle: {fontSize: 16, fontWeight: '800', color: '#173A30'},
  closeText: {fontSize: 28, color: '#536B60'},
  video: {width: '100%', aspectRatio: 16 / 9, backgroundColor: '#152A22'},
});
