import React, {useCallback, useEffect, useMemo, useState} from 'react';

import {
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

const formatDate = date => ({
  key: date.toISOString().slice(0, 10),
  month: date.toLocaleDateString('en-US', {month: 'short'}).toUpperCase(),
  number: date.getDate(),
});

const DailyCleaningScreen = ({navigation}) => {
  const [selectedProperty, setSelectedProperty] = useState('');
  const [dateOffset, setDateOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [savedRooms, setSavedRooms] = useState([]);
  const [activeMedia, setActiveMedia] = useState(null);

  const cleaningDates = useMemo(() => {
    const today = new Date();
    return Array.from({length: 5}, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() + dateOffset - 4 + index);
      return formatDate(date);
    });
  }, [dateOffset]);

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
    if (!selectedDate && cleaningDates.length) {
      setSelectedDate(cleaningDates[4].key);
    }
  }, [cleaningDates, selectedDate]);

  const selectedDateIndex = cleaningDates.findIndex(
    date => date.key === selectedDate,
  );

  const rooms = savedRooms.filter(
    room =>
      room.property === selectedProperty &&
      room.date === selectedDate,
  );

  const openAddRoom = () => {
    if (!selectedProperty || !selectedDate) {
      return;
    }

    navigation.navigate('AddRoom', {
      property: selectedProperty,
      date: selectedDate,
    });
  };

  const openEditRoom = room => {
    navigation.navigate('EditRoom', {room});
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

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>CLEANING DATES</Text>
        </View>

        <View style={styles.dateRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.dateArrow}
            onPress={() => setDateOffset(offset => Math.max(offset - 1, -30))}>
            <Text style={styles.dateArrowText}>‹</Text>
          </TouchableOpacity>

          {cleaningDates.map((date, index) => (
            <TouchableOpacity
              key={date.key}
              activeOpacity={0.8}
              style={[styles.dateCard, index === selectedDateIndex && styles.activeDateCard]}
              onPress={() => setSelectedDate(date.key)}>
              <Text style={styles.dateDay}>{date.month}</Text>
              <Text style={styles.dateNumber}>{date.number}</Text>
            </TouchableOpacity>
          ))}

          {dateOffset < 0 ? (
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.dateArrow}
              onPress={() => setDateOffset(offset => Math.min(offset + 1, 0))}>
              <Text style={styles.dateArrowText}>›</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.dateArrowPlaceholder} />
          )}
        </View>

        <View style={styles.roomsHeader}>
          <Text style={styles.sectionLabel}>ROOMS</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.addRoomButton}
            onPress={openAddRoom}>
            <Text style={styles.addRoomText}>+ Add room</Text>
          </TouchableOpacity>
        </View>

        {rooms.map(room => (
          <View key={room.id} style={styles.roomCard}>
            <Text style={styles.roomTitle}>{room.title}</Text>
            <Text style={styles.roomDescription}>{room.description}</Text>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.mediaPreview}
              onPress={() => setActiveMedia(room)}>
              <View style={styles.mediaTint} />
              {room.mediaType === 'photo' ? (
                <Image source={{uri: room.mediaUri}} style={styles.mediaImage} />
              ) : (
                <Text style={styles.mediaType}>VIDEO</Text>
              )}
              {room.mediaType === 'video' && (
                <View style={styles.playButton}>
                  <Text style={styles.playIcon}>▶</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.roomDivider} />
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.editButton}
              onPress={() => openEditRoom(room)}>
              <Text style={styles.editIcon}>⌕</Text>
              <Text style={styles.editText}>Edit log</Text>
            </TouchableOpacity>
          </View>
        ))}

        {!rooms.length && (
          <Text style={styles.emptyRoomsText}>
            No room logs saved for this property and date yet.
          </Text>
        )}
      </ScrollView>

      <Modal
        visible={Boolean(activeMedia)}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveMedia(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setActiveMedia(null)}>
          <Pressable style={styles.mediaModal} onPress={event => event.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{activeMedia?.title}</Text>
              <TouchableOpacity onPress={() => setActiveMedia(null)}>
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>
            </View>
            {activeMedia?.mediaType === 'video' ? (
              <Video
                source={{
                  uri:
                    activeMedia.mediaUri ||
                    'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
                }}
                style={styles.video}
                resizeMode="cover"
                controls
                paused={!activeMedia}
              />
            ) : (
              <Image
                source={{uri: activeMedia?.mediaUri}}
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
  sectionHeader: {marginBottom: 12},
  sectionLabel: {fontSize: 11, fontWeight: '800', letterSpacing: 1.5, color: '#849890'},
  dateRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28},
  dateArrow: {width: 34, height: 46, borderRadius: 12, borderWidth: 1, borderColor: '#DCE8E1', alignItems: 'center', justifyContent: 'center'},
  dateArrowPlaceholder: {width: 34, height: 46},
  dateArrowText: {fontSize: 25, color: '#789087', marginTop: -2},
  dateCard: {width: 55, height: 56, borderRadius: 14, borderWidth: 1, borderColor: '#DCE8E1', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FBF9'},
  activeDateCard: {backgroundColor: '#DDF5E8', borderColor: '#9EDDBB'},
  dateDay: {fontSize: 10, fontWeight: '800', color: '#7D9289', letterSpacing: 1},
  dateNumber: {fontSize: 16, fontWeight: '700', color: '#6D8279', marginTop: 5},
  roomsHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2},
  addRoomButton: {borderWidth: 1, borderColor: '#CFE6D9', backgroundColor: '#F8FCF9', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8},
  addRoomText: {fontSize: 12, color: '#287954', fontWeight: '700'},
  roomCard: {backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE8E1', borderRadius: 17, padding: 16, marginTop: 12},
  roomTitle: {fontSize: 15, fontWeight: '800', color: '#173A30'},
  roomDescription: {fontSize: 11, color: '#82958C', marginTop: 5},
  mediaPreview: {width: 76, height: 62, borderRadius: 11, overflow: 'hidden', backgroundColor: '#DCECE4', marginTop: 14, alignItems: 'center', justifyContent: 'center'},
  mediaTint: {position: 'absolute', inset: 0, backgroundColor: '#AFCFC0'},
  mediaImage: {width: '100%', height: '100%'},
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
  video: {width: '100%', height: 230, backgroundColor: '#152A22'},
});
