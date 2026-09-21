import React, {useMemo, useState} from 'react';

import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {launchImageLibrary} from 'react-native-image-picker';

const STORAGE_KEY = 'dailyCleaningRooms';
const PRIMARY = '#176B50';
const BACKGROUND = '#F4F8F5';

const getDateOptions = selectedDateValue => {
  const today = selectedDateValue ? new Date(`${selectedDateValue}T12:00:00`) : new Date();
  return Array.from({length: 7}, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index - 3);
    return {
      key: date.toISOString().slice(0, 10),
      month: date.toLocaleDateString('en-US', {month: 'short'}).toUpperCase(),
      number: date.getDate(),
    };
  });
};

const RoomLogScreen = ({navigation, route}) => {
  const existingRoom = route?.params?.room;
  const isReadOnly = Boolean(existingRoom);
  const [date, setDate] = useState(route?.params?.date || existingRoom?.date || '');
  const [title, setTitle] = useState(existingRoom?.title || '');
  const [description, setDescription] = useState(existingRoom?.description || '');
  const [media, setMedia] = useState(
    existingRoom?.mediaUri
      ? {uri: existingRoom.mediaUri, type: existingRoom.mediaType}
      : null,
  );

  const dateOptions = useMemo(
    () => getDateOptions(date || existingRoom?.date),
    [date, existingRoom?.date],
  );

  const chooseMedia = async () => {
    if (isReadOnly) {
      return;
    }

    const result = await launchImageLibrary({
      mediaType: 'mixed',
      selectionLimit: 1,
      videoQuality: 'low',
    });

    const asset = result.assets?.[0];
    if (asset?.uri) {
      setMedia({
        uri: asset.uri,
        type: asset.type?.startsWith('video') ? 'video' : 'photo',
      });
    }
  };

  const saveRoom = async () => {
    if (!date || !title.trim() || !description.trim()) {
      Alert.alert('Missing details', 'Please add a date, room title, and room log.');
      return;
    }

    try {
      const storedRooms = await AsyncStorage.getItem(STORAGE_KEY);
      const rooms = storedRooms ? JSON.parse(storedRooms) : [];
      const room = {
        id: existingRoom?.id || `${Date.now()}`,
        property: route?.params?.property || existingRoom?.property || '',
        date,
        title: title.trim(),
        description: description.trim(),
        mediaUri: media?.uri || '',
        mediaType: media?.type || '',
      };
      const updatedRooms = existingRoom
        ? rooms.map(item => (item.id === existingRoom.id ? room : item))
        : [...rooms, room];

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRooms));
      navigation.goBack();
    } catch (error) {
      Alert.alert('Unable to save', 'Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.eyebrow}>DAILY CLEANING</Text>
            <Text style={styles.title}>{isReadOnly ? 'Room log' : 'Add room'}</Text>
          </View>
        </View>

        <Text style={styles.label}>CLEANING DATE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
          {dateOptions.map(option => (
            <TouchableOpacity
              key={option.key}
              disabled={isReadOnly}
              style={[styles.dateCard, date === option.key && styles.activeDateCard]}
              onPress={() => setDate(option.key)}>
              <Text style={styles.dateMonth}>{option.month}</Text>
              <Text style={styles.dateNumber}>{option.number}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>ROOM TITLE</Text>
        <TextInput
          editable={!isReadOnly}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Standard room"
          placeholderTextColor="#9AAEA4"
          style={[styles.input, isReadOnly && styles.readOnlyInput]}
        />

        <Text style={styles.label}>ROOM LOG</Text>
        <TextInput
          editable={!isReadOnly}
          multiline
          value={description}
          onChangeText={setDescription}
          placeholder="Write the cleaning details..."
          placeholderTextColor="#9AAEA4"
          style={[styles.logInput, isReadOnly && styles.readOnlyInput]}
          textAlignVertical="top"
        />

        <Text style={styles.label}>PHOTO OR VIDEO</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.mediaPicker}
          onPress={chooseMedia}>
          {media?.type === 'photo' ? (
            <Image source={{uri: media.uri}} style={styles.mediaImage} />
          ) : (
            <Text style={styles.mediaPickerText}>
              {media?.type === 'video' ? 'VIDEO SELECTED' : isReadOnly ? 'No media added' : '+ Add photo or video'}
            </Text>
          )}
        </TouchableOpacity>

        {!isReadOnly && (
          <TouchableOpacity activeOpacity={0.85} style={styles.saveButton} onPress={saveRoom}>
            <Text style={styles.saveText}>Save room</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

export default RoomLogScreen;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: BACKGROUND},
  content: {padding: 16, paddingBottom: 36},
  headerRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 30},
  backButton: {width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#DCE8E1', alignItems: 'center', justifyContent: 'center', marginRight: 12},
  backText: {fontSize: 27, color: '#54756A', marginTop: -3},
  eyebrow: {fontSize: 11, fontWeight: '800', letterSpacing: 1.5, color: '#7C9489'},
  title: {fontSize: 25, fontWeight: '800', color: '#173A30', marginTop: 4},
  label: {fontSize: 11, fontWeight: '800', letterSpacing: 1.5, color: '#849890', marginTop: 20, marginBottom: 9},
  dateScroll: {marginHorizontal: -4},
  dateCard: {width: 66, height: 58, borderRadius: 13, borderWidth: 1, borderColor: '#DCE8E1', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginHorizontal: 4},
  activeDateCard: {backgroundColor: '#DDF5E8', borderColor: '#9EDDBB'},
  dateMonth: {fontSize: 10, fontWeight: '800', letterSpacing: 1, color: '#7D9289'},
  dateNumber: {fontSize: 17, fontWeight: '700', color: '#617970', marginTop: 5},
  input: {height: 52, borderWidth: 1, borderColor: '#D9E5DE', borderRadius: 12, backgroundColor: '#FFFFFF', paddingHorizontal: 15, color: '#173A30', fontSize: 14},
  logInput: {height: 150, borderWidth: 1, borderColor: '#D9E5DE', borderRadius: 14, backgroundColor: '#FFFFFF', padding: 15, color: '#173A30', fontSize: 14, lineHeight: 21},
  readOnlyInput: {backgroundColor: '#F0F6F2'},
  mediaPicker: {height: 110, width: 110, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: '#9EDDBB', backgroundColor: '#F8FCF9', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'},
  mediaImage: {width: '100%', height: '100%'},
  mediaPickerText: {fontSize: 11, fontWeight: '700', color: '#438B6D', textAlign: 'center', paddingHorizontal: 8},
  saveButton: {alignSelf: 'flex-start', marginTop: 28, backgroundColor: PRIMARY, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 13},
  saveText: {fontSize: 13, fontWeight: '800', color: '#FFFFFF'},
});
