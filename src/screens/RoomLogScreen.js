import React, {useEffect, useState} from 'react';

import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import Video from 'react-native-video';
import PageHeader from '../components/PageHeader';

const STORAGE_KEY = 'dailyCleaningRooms';
const PRIMARY = '#176B50';
const BACKGROUND = '#F4F8F5';

const getStoredMedia = room => {
  if (Array.isArray(room?.media)) {
    return room.media;
  }

  return room?.mediaUri
    ? [{
        uri: room.mediaUri,
        type: room.mediaType || 'photo',
        fileName: room.mediaName || 'Uploaded file',
      }]
    : [];
};

const RoomLogScreen = ({navigation, route}) => {
  const existingRoom = route?.params?.room;
  const todayKey = new Date().toISOString().slice(0, 10);
  const date = route?.params?.date || existingRoom?.date || '';
  const [dateRoom, setDateRoom] = useState(null);
  const [title, setTitle] = useState(existingRoom?.title || route?.params?.sectionTitle || '');
  const [description, setDescription] = useState(existingRoom?.description || '');
  const [media, setMedia] = useState(getStoredMedia(existingRoom));
  const displayedRoom = existingRoom || dateRoom;
  const isReadOnly = date < todayKey;

  useEffect(() => {
    if (existingRoom || !date) {
      return;
    }

    const loadRoomForDate = async () => {
      try {
        const storedRooms = await AsyncStorage.getItem(STORAGE_KEY);
        const rooms = storedRooms ? JSON.parse(storedRooms) : [];
        const room = rooms.find(
          item =>
            item.property === route?.params?.property &&
            item.date === date &&
            item.title === route?.params?.sectionTitle,
        );
        setDateRoom(room || null);
      } catch (error) {
        setDateRoom(null);
      }
    };

    loadRoomForDate();
  }, [date, existingRoom, route?.params?.property, route?.params?.sectionTitle]);

  useEffect(() => {
    if (!displayedRoom) {
      setTitle(route?.params?.sectionTitle || '');
      setDescription('');
      setMedia([]);
      return;
    }

    setTitle(displayedRoom.title || '');
    setDescription(displayedRoom.description || '');
    setMedia(getStoredMedia(displayedRoom));
  }, [displayedRoom, route?.params?.sectionTitle]);

  const chooseMedia = async source => {
    if (isReadOnly) {
      return;
    }

    const picker = source === 'camera' ? launchCamera : launchImageLibrary;
    const result = await picker({
      mediaType: 'mixed',
      selectionLimit: source === 'camera' ? 1 : 0,
      videoQuality: 'low',
    });

    const selectedMedia = (result.assets || [])
      .filter(asset => asset?.uri)
      .map(asset => ({
        uri: asset.uri,
        type: asset.type?.startsWith('video') ? 'video' : 'photo',
        fileName: asset.fileName || asset.uri.split('/').pop() || 'Uploaded file',
        width: asset.width,
        height: asset.height,
      }));

    if (selectedMedia.length) {
      setMedia(currentMedia => [...currentMedia, ...selectedMedia]);
    }
  };

  const openUploadOptions = () => {
    if (isReadOnly) {
      return;
    }

    Alert.alert('Upload', 'Choose a source', [
      {text: 'Camera', onPress: () => chooseMedia('camera')},
      {text: 'Gallery', onPress: () => chooseMedia('gallery')},
      {text: 'Cancel', style: 'cancel'},
    ]);
  };

  const saveRoom = async () => {
    if (isReadOnly) {
      return;
    }

    if (!date || !title.trim() || !description.trim()) {
      Alert.alert('Missing details', 'Please add a date, section, and comment.');
      return;
    }

    try {
      const storedRooms = await AsyncStorage.getItem(STORAGE_KEY);
      const rooms = storedRooms ? JSON.parse(storedRooms) : [];
      const room = {
        id: displayedRoom?.id || `${Date.now()}`,
        property: route?.params?.property || displayedRoom?.property || '',
        date,
        title: title.trim(),
        description: description.trim(),
        media,
        mediaUri: media[0]?.uri || '',
        mediaType: media[0]?.type || '',
        mediaName: media[0]?.fileName || '',
      };
      const updatedRooms = displayedRoom
        ? rooms.map(item => (item.id === displayedRoom.id ? room : item))
        : [...rooms, room];

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRooms));
      navigation.goBack();
    } catch (error) {
      Alert.alert('Unable to save', 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <PageHeader navigation={navigation} title="Daily cleaning checklist" showMenu={false} />

        <Text style={styles.label}>CLEANING DATE</Text>
        <View style={[styles.dateValue, styles.readOnlyInput]}>
          <Text style={styles.dateValueText}>{date}</Text>
        </View>

        <Text style={styles.label}>SECTION</Text>
        <TextInput
          editable={false}
          value={title}
          placeholder="Selected section"
          placeholderTextColor="#9AAEA4"
          style={[styles.input, styles.readOnlyInput]}
        />

        <Text style={styles.label}>COMMENT</Text>
        <TextInput
          editable={!isReadOnly}
          multiline
          value={description}
          onChangeText={setDescription}
          placeholder="Add a comment about the cleaning..."
          placeholderTextColor="#9AAEA4"
          style={[styles.logInput, isReadOnly && styles.readOnlyInput]}
          textAlignVertical="top"
        />

        <Text style={styles.label}>UPLOAD</Text>
        <View style={[styles.mediaPicker, isReadOnly && styles.readOnlyInput]}>
          <View style={styles.mediaList}>
            {media.length ? media.map((item, index) => (
              <View key={`${item.uri}-${index}`} style={styles.mediaRow}>
                {item.type === 'photo' ? (
                  <Image source={{uri: item.uri}} style={styles.mediaThumbnail} />
                ) : (
                  <Video
                    source={{uri: item.uri}}
                    style={styles.mediaThumbnail}
                    resizeMode="cover"
                    paused
                    muted
                  />
                )}
                <Text style={styles.mediaFileName} numberOfLines={1}>{item.fileName}</Text>
                {!isReadOnly && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.removeMediaButton}
                    onPress={() => setMedia(current => current.filter((_, mediaIndex) => mediaIndex !== index))}>
                    <Text style={styles.removeMediaText}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
            )) : (
              <Text style={styles.mediaPickerText}>No files uploaded</Text>
            )}
          </View>
          {!isReadOnly && (
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.uploadButton}
              onPress={openUploadOptions}>
              <Text style={styles.uploadButtonText}>Upload</Text>
            </TouchableOpacity>
          )}
        </View>

        {!isReadOnly && (
          <TouchableOpacity activeOpacity={0.85} style={styles.saveButton} onPress={saveRoom}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
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
  dateValue: {height: 52, borderWidth: 1, borderColor: '#D9E5DE', borderRadius: 12, justifyContent: 'center', paddingHorizontal: 15},
  dateValueText: {fontSize: 14, fontWeight: '700', color: '#617970'},
  input: {height: 52, borderWidth: 1, borderColor: '#D9E5DE', borderRadius: 12, backgroundColor: '#FFFFFF', paddingHorizontal: 15, color: '#173A30', fontSize: 14},
  logInput: {height: 150, borderWidth: 1, borderColor: '#D9E5DE', borderRadius: 14, backgroundColor: '#FFFFFF', padding: 15, color: '#173A30', fontSize: 14, lineHeight: 21},
  readOnlyInput: {backgroundColor: '#F0F6F2'},
  mediaPicker: {minHeight: 110, width: '100%', borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: '#9EDDBB', backgroundColor: '#F8FCF9', flexDirection: 'row', alignItems: 'center', padding: 12, overflow: 'hidden'},
  mediaList: {flex: 1, minHeight: 82, justifyContent: 'center'},
  mediaRow: {flexDirection: 'row', alignItems: 'center', marginVertical: 3},
  mediaThumbnail: {width: 44, height: 44, borderRadius: 8, marginRight: 8},
  mediaIcon: {width: 30, height: 30, borderRadius: 7, backgroundColor: '#DDF5E8', alignItems: 'center', justifyContent: 'center', marginRight: 8},
  mediaIconText: {fontSize: 9, fontWeight: '800', color: '#287954'},
  mediaFileName: {flex: 1, fontSize: 12, color: '#287954'},
  removeMediaButton: {width: 28, height: 28, borderRadius: 14, backgroundColor: '#FDECEC', alignItems: 'center', justifyContent: 'center', marginLeft: 8},
  removeMediaText: {fontSize: 20, lineHeight: 22, color: '#C84F4F'},
  mediaPickerText: {fontSize: 11, fontWeight: '700', color: '#438B6D', textAlign: 'center', paddingHorizontal: 8},
  uploadActions: {marginLeft: 12, gap: 8},
  uploadButton: {borderWidth: 1, borderColor: '#B9DCC8', backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9},
  uploadButtonText: {fontSize: 12, fontWeight: '700', color: '#287954'},
  saveButton: {alignSelf: 'flex-start', marginTop: 28, backgroundColor: PRIMARY, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 13},
  saveText: {fontSize: 13, fontWeight: '800', color: '#FFFFFF'},
});
