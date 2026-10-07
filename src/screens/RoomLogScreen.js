import React, { useEffect, useState } from 'react';

import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Video from 'react-native-video';
import PageHeader from '../components/PageHeader';

const STORAGE_KEY = 'dailyCleaningRooms';

const PRIMARY = '#176B50';
const BACKGROUND = '#F4F8F5';

const CREATE_API = 'https://staysereno.in/api/staff/daily-cleaning-checklist';

const getDateKey = date => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const normalizeServerMedia = item => {
  if (!item) {
    return null;
  }

  const uri =
    item?.uri ||
    item?.url ||
    item?.path ||
    item?.file_url ||
    item?.file ||
    item?.file_name ||
    '';

  if (!uri) {
    return null;
  }

  const isVideo =
    item?.type === 'video' ||
    item?.mime?.startsWith?.('video/') ||
    item?.mime_type?.startsWith?.('video/');

  return {
    ...item,

    // VERY IMPORTANT
    isServerMedia: true,

    // SERVER MEDIA PRIMARY ID
    id:
      item?.media_id ??
      item?.mediaId ??
      item?.checklist_media_id ??
      item?.id ??
      null,

    media_id:
      item?.media_id ??
      item?.mediaId ??
      item?.checklist_media_id ??
      item?.id ??
      null,

    checklist_media_id:
      item?.checklist_media_id ??
      item?.media_id ??
      item?.mediaId ??
      item?.id ??
      null,

    tbl_daily_cleaning_checklist_id:
      item?.tbl_daily_cleaning_checklist_id ?? null,

    uri,

    url: item?.url || uri,

    fileName:
      item?.fileName ||
      item?.file_name ||
      item?.name ||
      item?.original_name ||
      item?.originalName ||
      uri.split('/').pop() ||
      'Uploaded file',

    file_name:
      item?.file_name ||
      item?.fileName ||
      item?.name ||
      uri.split('/').pop() ||
      'Uploaded file',

    type: isVideo ? 'video' : 'photo',

    mime:
      item?.mime || item?.mime_type || (isVideo ? 'video/mp4' : 'image/jpeg'),
  };
};

const getStoredMedia = room => {
  let rawMedia = [];

  if (Array.isArray(room?.media)) {
    rawMedia = room.media;
  } else if (Array.isArray(room?.medias)) {
    rawMedia = room.medias;
  } else if (Array.isArray(room?.media_files)) {
    rawMedia = room.media_files;
  } else if (Array.isArray(room?.images)) {
    rawMedia = room.images;
  }

  const normalized = rawMedia
    .map(item => {
      if (typeof item === 'string') {
        return normalizeServerMedia({
          uri: item,
          url: item,
          type: 'photo',
        });
      }

      return normalizeServerMedia(item);
    })
    .filter(Boolean);

  if (normalized.length) {
    return normalized;
  }

  if (room?.mediaUri) {
    return [
      normalizeServerMedia({
        id: room?.mediaId ?? room?.media_id ?? room?.checklist_media_id ?? null,

        uri: room.mediaUri,

        url: room.mediaUri,

        type: room.mediaType || 'photo',

        fileName: room.mediaName || 'Uploaded file',
      }),
    ].filter(Boolean);
  }

  return [];
};

const getMediaDisplayName = item => {
  const rawName =
    item?.fileName ||
    item?.file_name ||
    item?.name ||
    item?.uri ||
    item?.url ||
    'Uploaded file';

  return (
    String(rawName).split('/').pop().split('?')[0].split('#')[0] ||
    'Uploaded file'
  );
};

const getChecklistId = room => {
  return (
    room?.checklistId ??
    room?.checklist_id ??
    room?.daily_cleaning_checklist_id ??
    room?.dailyCleaningChecklistId ??
    room?.apiId ??
    null
  );
};

const RoomLogScreen = ({ navigation, route }) => {
  const existingRoom = route?.params?.room;

  const todayKey = getDateKey(new Date());

  const date = route?.params?.date || existingRoom?.date || '';

  const [dateRoom, setDateRoom] = useState(null);

  const displayedRoom = existingRoom || dateRoom;

  const [title, setTitle] = useState(
    existingRoom?.title || route?.params?.sectionTitle || '',
  );

  const [description, setDescription] = useState(
    existingRoom?.description || '',
  );

  const [media, setMedia] = useState(getStoredMedia(existingRoom));

  const [removedMedia, setRemovedMedia] = useState([]);

  const [previewMedia, setPreviewMedia] = useState(null);
  const [uploadMenuVisible, setUploadMenuVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const isReadOnly = date !== todayKey;

  const isEditMode = Boolean(getChecklistId(displayedRoom));

  // =========================================================
  // RESOLVE SECTION ID
  // =========================================================

  const resolveSectionId = () => {
    const directId =
      route?.params?.sectionId ??
      route?.params?.section?.id ??
      displayedRoom?.sectionId ??
      displayedRoom?.section_id ??
      displayedRoom?.section?.id ??
      null;

    console.log('ROOM LOG RESOLVE SECTION ID:', {
      routeParams: route?.params,
      displayedRoom,
      directId,
    });

    if (directId !== null && directId !== undefined && directId !== '') {
      return Number(directId);
    }

    const storedRooms = route?.params?.storedRooms || [];

    const matchingStoredRoom = storedRooms.find(item => {
      return (
        String(item?.date || '') === String(date) &&
        String(item?.title || '') ===
          String(title || route?.params?.sectionTitle || '')
      );
    });

    const fallbackId =
      matchingStoredRoom?.sectionId ?? matchingStoredRoom?.section_id ?? null;

    return fallbackId !== null && fallbackId !== undefined && fallbackId !== ''
      ? Number(fallbackId)
      : null;
  };

  // =========================================================
  // LOAD ROOM FROM STORAGE
  // =========================================================

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
            String(item?.property || '') ===
              String(route?.params?.property || '') &&
            String(item?.date || '') === String(date) &&
            String(item?.title || '') ===
              String(route?.params?.sectionTitle || ''),
        );

        setDateRoom(room || null);
      } catch (error) {
        console.log('LOAD ROOM ERROR:', error);

        setDateRoom(null);
      }
    };

    loadRoomForDate();
  }, [
    date,
    existingRoom,
    route?.params?.property,
    route?.params?.sectionTitle,
  ]);

  // =========================================================
  // SET ROOM DATA
  // =========================================================

  useEffect(() => {
    console.log('========== EDIT ROOM MEDIA ==========');

    console.log('DISPLAYED ROOM:', displayedRoom);

    console.log('RAW ROOM MEDIA:', displayedRoom?.media);

    console.log('NORMALIZED MEDIA:', getStoredMedia(displayedRoom));

    console.log('=====================================');

    if (!displayedRoom) {
      setTitle(route?.params?.sectionTitle || '');
      setDescription('');
      setMedia([]);
      return;
    }

    setTitle(displayedRoom.title || route?.params?.sectionTitle || '');

    setDescription(displayedRoom.description || '');

    setMedia(getStoredMedia(displayedRoom));

    setRemovedMedia([]);
  }, [displayedRoom, route?.params?.sectionTitle]);

  // =========================================================
  // TOKEN
  // =========================================================

  const getAuthToken = async () => {
    const keys = ['authToken', 'token', 'access_token', 'userToken'];

    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);

      if (value && value.trim()) {
        return value.trim();
      }
    }

    return null;
  };

  // =========================================================
  // USER ID
  // =========================================================

  const resolveStoredUserId = async () => {
    const candidates = [
      route?.params?.userId,
      route?.params?.user_id,
      route?.params?.user?.id,
      route?.params?.user?.user_id,
      route?.params?.admin?.id,
      route?.params?.admin?.user_id,
      await AsyncStorage.getItem('userId'),
      await AsyncStorage.getItem('userData'),
      await AsyncStorage.getItem('user'),
    ];

    for (const candidate of candidates) {
      if (candidate === null || candidate === undefined) {
        continue;
      }

      const stringCandidate = String(candidate).trim();

      if (/^\d+$/.test(stringCandidate)) {
        return stringCandidate;
      }

      try {
        const parsed =
          typeof candidate === 'string' ? JSON.parse(candidate) : candidate;

        const id =
          parsed?.id ??
          parsed?.user_id ??
          parsed?.userId ??
          parsed?.data?.id ??
          parsed?.data?.user_id ??
          parsed?.data?.userId ??
          null;

        if (id !== null && id !== undefined && id !== '') {
          return String(id);
        }
      } catch (error) {
        // ignore
      }
    }

    return null;
  };

  // =========================================================
  // PROPERTY ID
  // =========================================================

  const resolveStoredPropertyId = async () => {
    const candidates = [
      route?.params?.propertyId,
      route?.params?.unit_id,
      route?.params?.property?.unit_id,
      route?.params?.property?.id,
      route?.params?.unit?.id,

      displayedRoom?.propertyId,
      displayedRoom?.unit_id,
      displayedRoom?.unitId,
      displayedRoom?.property?.unit_id,
      displayedRoom?.property?.id,
      displayedRoom?.property_id,

      await AsyncStorage.getItem('dailyCleaningSelectedPropertyId'),

      await AsyncStorage.getItem('selectedPropertyId'),
    ];

    for (const candidate of candidates) {
      if (candidate !== null && candidate !== undefined && candidate !== '') {
        return String(candidate);
      }
    }

    return null;
  };

  // =========================================================
  // MEDIA PICKER
  // =========================================================

  const chooseMedia = async (source, mediaType = 'photo') => {
    if (isReadOnly || saving) {
      return;
    }

    try {
      const picker = source === 'camera' ? launchCamera : launchImageLibrary;

      const pickerOptions = {
        mediaType:
          mediaType === 'mixed'
            ? 'mixed'
            : mediaType === 'video'
            ? 'video'
            : 'photo',

        selectionLimit: source === 'camera' ? 1 : 0,

        // PHOTO OPTIMIZATION
        quality: 0.6,
        maxWidth: 1280,
        maxHeight: 1280,

        // VIDEO
        videoQuality: 'low',
      };

      const result = await picker(pickerOptions);

      if (result?.didCancel) {
        return;
      }

      if (result?.errorCode) {
        Alert.alert(
          'Upload error',
          result?.errorMessage || 'Unable to select media.',
        );
        return;
      }

      const selectedMedia = (result.assets || [])
        .filter(asset => asset?.uri)
        .map(asset => {
          const isVideo =
            asset.type?.startsWith('video/') || mediaType === 'video';

          return {
            uri: asset.uri,

            type: isVideo ? 'video' : 'photo',

            mime: asset.type || (isVideo ? 'video/mp4' : 'image/jpeg'),

            fileName:
              asset.fileName ||
              asset.uri.split('/').pop() ||
              `upload_${Date.now()}`,

            width: asset.width,
            height: asset.height,

            fileSize: asset.fileSize || 0,

            isServerMedia: false,
          };
        });

      if (selectedMedia.length) {
        setMedia(currentMedia => [...currentMedia, ...selectedMedia]);
      }
    } catch (error) {
      console.log('MEDIA PICK ERROR:', error);

      Alert.alert('Upload error', 'Unable to select media.');
    }
  };

  // =========================================================
  // UPLOAD OPTIONS
  // =========================================================

  const openUploadOptions = () => {
    if (isReadOnly || saving) {
      return;
    }

    setUploadMenuVisible(true);
  };

  const openMediaPreview = item => {
    if (!item?.uri) {
      return;
    }

    setPreviewMedia(item);
  };

  // =========================================================
  // SAVE / CREATE
  // =========================================================

  const createChecklist = async ({
    userId,
    propertyId,
    sectionId,
    comment,
    token,
  }) => {
    const validMedia = media.filter(item => item?.uri);

    const formData = new FormData();

    formData.append('user_id', String(Number(userId)));

    formData.append('unit_id', String(Number(propertyId)));

    formData.append('section', String(Number(sectionId)));

    formData.append('comment', comment);

    validMedia.forEach((item, index) => {
      const uri = item.uri;

      const fileName =
        item.fileName || uri.split('/').pop() || `media_${index}`;

      const type =
        item?.mime || (item?.type === 'video' ? 'video/mp4' : 'image/jpeg');

      formData.append(`media[${index}]`, {
        uri,
        name: fileName,
        type,
      });
    });

    console.log('DAILY CHECKLIST CREATE REQUEST:', {
      user_id: userId,
      unit_id: propertyId,
      section: sectionId,
      comment,
      mediaCount: validMedia.length,
    });

    const response = await fetch(CREATE_API, {
      method: 'POST',

      headers: {
        Accept: 'application/json',

        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
      },

      body: formData,
    });

    const responseText = await response.text();

    console.log('CREATE STATUS:', response.status);

    console.log('CREATE RESPONSE:', responseText);

    let responseData = null;

    try {
      responseData = responseText ? JSON.parse(responseText) : null;
    } catch (error) {
      responseData = null;
    }

    if (!response.ok) {
      throw new Error(
        responseData?.message ||
          responseData?.error ||
          'Checklist could not be saved.',
      );
    }

    return responseData;
  };

  // =========================================================
  // UPDATE CHECKLIST
  // =========================================================

  const updateChecklist = async ({
  checklistId,
  userId,
  propertyId,
  sectionId,
  comment,
  token,
}) => {
  if (!checklistId) {
    throw new Error('Checklist ID missing.');
  }

  const url = `${CREATE_API}/${checklistId}`;

  // New files
  const newMedia = media.filter(
    item => item?.uri && !item?.isServerMedia,
  );

  // Existing server files user ne KEEP ki hain
 const existingMedia = media.filter(
  item => item?.isServerMedia === true,
);

const removedServerMedia = removedMedia.filter(item => {
  const mediaId =
    item?.id ??
    item?.media_id ??
    item?.mediaId ??
    item?.checklist_media_id ??
    null;

  return (
    mediaId !== null &&
    mediaId !== undefined &&
    mediaId !== ''
  );
});

const existingMediaPayload = [
  ...existingMedia.map(item => {
    const mediaId =
      item?.id ??
      item?.media_id ??
      item?.mediaId ??
      item?.checklist_media_id ??
      null;

    return {
      id: Number(mediaId),
      name:
        item?.fileName ||
        item?.file_name ||
        item?.name ||
        item?.url ||
        item?.uri ||
        '',
      uri:
        item?.uri ||
        item?.url ||
        item?.file_url ||
        '',
      is_remove: 0,
    };
  }),

  ...removedServerMedia.map(item => {
    const mediaId =
      item?.id ??
      item?.media_id ??
      item?.mediaId ??
      item?.checklist_media_id ??
      null;

    return {
      id: Number(mediaId),
      name:
        item?.fileName ||
        item?.file_name ||
        item?.name ||
        item?.url ||
        item?.uri ||
        '',
      uri:
        item?.uri ||
        item?.url ||
        item?.file_url ||
        '',
      is_remove: 1,
    };
  }),
];

console.log(
  'KEEP EXISTING:',
  JSON.stringify(existingMediaPayload, null, 2),
);

  console.log('========================================');
  console.log('UPDATE CHECKLIST');
  console.log('URL:', url);
  console.log('CHECKLIST ID:', checklistId);
  console.log('USER ID:', userId);
  console.log('UNIT ID:', propertyId);
  console.log('SECTION ID:', sectionId);
  console.log('NEW MEDIA:', newMedia.length);
  console.log('EXISTING MEDIA:', existingMedia.length);
  console.log('REMOVED MEDIA:', removedServerMedia.length);
  console.log('REMOVED MEDIA DATA:', removedServerMedia);
  console.log('========================================');

  // IMPORTANT:
  // FormData must be created BEFORE appending anything
  const formData = new FormData();

  formData.append('_method', 'PUT');

  formData.append('user_id', String(userId));
  formData.append('unit_id', String(propertyId));
  formData.append('section', String(sectionId));
  formData.append('comment', String(comment || ''));

  const mediaPayload = [
    ...media
      .filter(item => item?.uri)
      .map(item => ({
        item,
        isRemove: 0,
      })),
    ...removedMedia.map(item => ({
      item,
      isRemove: 1,
    })),
  ];

  console.log(
    'MEDIA UPDATE PAYLOAD:',
    mediaPayload.map(({item, isRemove}) => ({
      id:
        item?.media_id ??
        item?.mediaId ??
        item?.checklist_media_id ??
        item?.id ??
        null,
      file_name:
        item?.fileName ||
        item?.file_name ||
        item?.name ||
        getMediaDisplayName(item),
      type: item?.type,
      is_remove: isRemove,
    })),
  );

  let uploadIndex = 0;

  mediaPayload.forEach(({item, isRemove}, index) => {
    const fileName =
      item?.fileName ||
      item?.file_name ||
      item?.name ||
      getMediaDisplayName(item) ||
      'Uploaded file';

    formData.append(
      `media[${index}][file_name]`,
      String(fileName),
    );

    formData.append(
      `media[${index}][type]`,
      item?.type === 'video' ? 'video' : 'image',
    );

    const mediaId =
      item?.media_id ??
      item?.mediaId ??
      item?.checklist_media_id ??
      item?.id ??
      '';

    if (mediaId !== '') {
      formData.append(
        `media[${index}][id]`,
        String(mediaId),
      );
    }

    formData.append(
      `media[${index}][is_remove]`,
      String(isRemove),
    );

    if (!isRemove && !item?.isServerMedia && item?.uri) {
      const isVideo =
        item?.type === 'video' ||
        item?.mime?.startsWith?.('video/');

      formData.append(`media[${uploadIndex}]`, {
        uri: item.uri,
        type:
          item?.mime ||
          (isVideo ? 'video/mp4' : 'image/jpeg'),
        name: fileName,
      });

      formData.append(
        `media_type[${uploadIndex}]`,
        isVideo ? 'video' : 'image',
      );

      uploadIndex += 1;
    }
  });
  // NEW MEDIA

  console.log(
    'KEEP EXISTING:',
    existingMedia.map(item => ({
      id:
        item?.id ??
        item?.media_id ??
        item?.mediaId ??
        item?.checklist_media_id,
      name:
        item?.fileName ||
        item?.file_name ||
        item?.name,
      uri:
        item?.uri ||
        item?.url,
    })),
  );

  console.log(
    'DELETE EXISTING:',
    removedServerMedia.map(item => ({
      id:
        item?.id ??
        item?.media_id ??
        item?.mediaId ??
        item?.checklist_media_id,
      name:
        item?.fileName ||
        item?.file_name ||
        item?.name,
      uri:
        item?.uri ||
        item?.url,
    })),
  );

  const response = await fetch(url, {
    method: 'POST',

    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },

    body: formData,
  });

  console.log(
    'UPDATE MULTIPART STATUS:',
    response.status,
  );

  const responseText = await response.text();

  console.log(
    'UPDATE MULTIPART RESPONSE:',
    responseText,
  );

  let responseData = null;

  try {
    responseData = responseText
      ? JSON.parse(responseText)
      : null;
  } catch (error) {
    throw new Error(
      responseText || 'Invalid server response.',
    );
  }

  if (
    !response.ok ||
    responseData?.status === false
  ) {
    const validationErrors =
      responseData?.errors;

    if (validationErrors) {
      const errorMessages = Object.entries(
        validationErrors,
      )
        .map(([field, messages]) => {
          if (Array.isArray(messages)) {
            return `${field}: ${messages.join(', ')}`;
          }

          return `${field}: ${String(messages)}`;
        })
        .join('\n');

      throw new Error(
        errorMessages ||
          responseData?.message ||
          'Validation failed.',
      );
    }

    throw new Error(
      responseData?.message ||
        'Failed to update checklist.',
    );
  }

  return responseData?.data || responseData;
};

  const persistLocalRoom = async room => {
    const storedRooms = await AsyncStorage.getItem(STORAGE_KEY);

    const rooms = storedRooms ? JSON.parse(storedRooms) : [];

    const existingIndex = rooms.findIndex(item => {
      const itemChecklistId =
        item?.checklistId ??
        item?.checklist_id ??
        item?.daily_cleaning_checklist_id ??
        item?.dailyCleaningChecklistId ??
        item?.apiId ??
        null;

      if (
        room.checklistId !== null &&
        room.checklistId !== undefined &&
        room.checklistId !== '' &&
        itemChecklistId !== null &&
        itemChecklistId !== undefined &&
        itemChecklistId !== '' &&
        String(itemChecklistId) === String(room.checklistId)
      ) {
        return true;
      }

      if (
        displayedRoom?.id !== null &&
        displayedRoom?.id !== undefined &&
        displayedRoom?.id !== '' &&
        String(item?.id) === String(displayedRoom.id)
      ) {
        return true;
      }

      const sameProperty =
        String(item?.propertyId ?? item?.unit_id ?? '') ===
        String(room.propertyId);

      const sameDate = String(item?.date || '') === String(date);

      const sameSection =
        String(item?.sectionId ?? item?.section_id ?? '') ===
        String(room.sectionId);

      return sameProperty && sameDate && sameSection;
    });

    let updatedRooms = [...rooms];

    if (existingIndex !== -1) {
      updatedRooms[existingIndex] = {
        ...rooms[existingIndex],
        ...room,
        id: rooms[existingIndex]?.id || room.id,
        checklistId:
          room.checklistId || rooms[existingIndex]?.checklistId || null,
        checklist_id:
          room.checklist_id || rooms[existingIndex]?.checklist_id || null,
      };
    } else {
      updatedRooms = [...rooms, room];
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRooms));

    return updatedRooms;
  };

  // =========================================================
  // SAVE ROOM
  // =========================================================
  const saveRoom = async () => {
    if (isReadOnly || saving) {
      return;
    }

    const normalizedComment = (description || '').trim();

    if (!date || !title.trim() || !normalizedComment) {
      Alert.alert('Missing details', 'Please add a comment.');
      return;
    }

    const propertyId = await resolveStoredPropertyId();

    const sectionId = resolveSectionId();

    const userId = await resolveStoredUserId();

    const token = await getAuthToken();

    const currentChecklistId = getChecklistId(displayedRoom);

    if (!propertyId || !userId || !sectionId) {
      Alert.alert(
        'Missing required data',
        'Property, user, or section information is missing. Please reopen this room from the daily cleaning screen.',
      );
      return;
    }

    if (!token) {
      Alert.alert('Session expired', 'Please login again and try once more.');
      return;
    }

    try {
      setSaving(true);

      const localRoomId =
        displayedRoom?.id ?? displayedRoom?.roomId ?? `${Date.now()}`;

      const localRoom = {
        id: String(localRoomId),
        checklistId:
          currentChecklistId !== null &&
          currentChecklistId !== undefined &&
          currentChecklistId !== ''
            ? String(currentChecklistId)
            : null,
        checklist_id:
          currentChecklistId !== null &&
          currentChecklistId !== undefined &&
          currentChecklistId !== ''
            ? String(currentChecklistId)
            : null,
        property: route?.params?.property || displayedRoom?.property || '',
        propertyId: String(propertyId),
        unit_id: String(propertyId),
        sectionId: Number(sectionId),
        section_id: Number(sectionId),
        date,
        title: title.trim(),
        description: normalizedComment,
        media,
        mediaUri: media[0]?.uri || '',
        mediaType: media[0]?.type || '',
        mediaName: media[0]?.fileName || '',
      };

      // await persistLocalRoom(localRoom);

      let responseData = null;

      if (currentChecklistId) {
        responseData = await updateChecklist({
          checklistId: currentChecklistId,
          userId,
          propertyId,
          sectionId,
          comment: normalizedComment,
          token,
        });
      } else {
        responseData = await createChecklist({
          userId,
          propertyId,
          sectionId,
          comment: normalizedComment,
          token,
        });
      }

      const apiChecklistId =
        responseData?.id ??
        responseData?.checklist_id ??
        responseData?.checklistId ??
        responseData?.data?.id ??
        responseData?.data?.checklist_id ??
        responseData?.data?.checklistId ??
        responseData?.data?.data?.id ??
        responseData?.result?.id ??
        currentChecklistId ??
        displayedRoom?.checklistId ??
        displayedRoom?.checklist_id ??
        null;

      const responseMedia =
        Array.isArray(responseData?.media)
          ? responseData.media
          : Array.isArray(responseData?.data?.media)
          ? responseData.data.media
          : [];

      const updatedMedia =
        responseMedia.length > 0
          ? getStoredMedia({media: responseMedia})
          : media;

      const room = {
        id: String(
          displayedRoom?.id ??
            displayedRoom?.roomId ??
            localRoomId ??
            apiChecklistId ??
            `${Date.now()}`,
        ),
        checklistId:
          apiChecklistId !== null &&
          apiChecklistId !== undefined &&
          apiChecklistId !== ''
            ? String(apiChecklistId)
            : null,
        checklist_id:
          apiChecklistId !== null &&
          apiChecklistId !== undefined &&
          apiChecklistId !== ''
            ? String(apiChecklistId)
            : null,
        property: route?.params?.property || displayedRoom?.property || '',
        propertyId: String(propertyId),
        unit_id: String(propertyId),
        sectionId: Number(sectionId),
        section_id: Number(sectionId),
        date,
        title: title.trim(),
        description: normalizedComment,
        media: updatedMedia,
        mediaUri: updatedMedia[0]?.uri || '',
        mediaType: updatedMedia[0]?.type || '',
        mediaName: updatedMedia[0]?.fileName || '',
      };

      // await persistLocalRoom(room);

      Alert.alert(
        currentChecklistId ? 'Updated' : 'Saved',
        currentChecklistId
          ? 'Cleaning checklist updated successfully.'
          : 'Cleaning checklist saved successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              // DailyCleaningScreen par focus hone par refresh force karne ke liye goBack karein
              navigation.goBack();
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        currentChecklistId ? 'Update failed' : 'Save failed',
        error?.message || 'Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader
        navigation={navigation}
        title={
          isEditMode ? 'Edit cleaning checklist' : 'Daily cleaning checklist'
        }
        showMenu={false}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
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
          editable={!isReadOnly && !saving}
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
            {media.length ? (
              media.map((item, index) => (
                <View key={`${item.uri}-${index}`} style={styles.mediaRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => openMediaPreview(item)}
                    style={styles.mediaPreviewButton}
                  >
                    {item.type === 'photo' ? (
                      <Image
                        source={{
                          uri: item.uri,
                        }}
                        style={styles.mediaThumbnail}
                      />
                    ) : (
                      <View style={styles.mediaVideoThumbnail}>
                        <Text style={styles.mediaVideoIcon}>▶</Text>
                      </View>
                    )}

                    <Text style={styles.mediaFileName} numberOfLines={1}>
                      {getMediaDisplayName(item)}
                    </Text>
                  </TouchableOpacity>

                  {!isReadOnly && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.removeMediaButton}
                      onPress={() => {
                        const removedItem = media[index];

                        if (!removedItem) {
                          return;
                        }

                        const serverMediaId =
                          removedItem?.id ??
                          removedItem?.media_id ??
                          removedItem?.mediaId ??
                          removedItem?.checklist_media_id ??
                          null;

                        const isExistingServerMedia =
                          removedItem?.isServerMedia === true ||
                          serverMediaId !== null ||
                          Boolean(removedItem?.url) ||
                          Boolean(removedItem?.file_url);

                        console.log('========== REMOVE MEDIA ==========');

                        console.log('REMOVED MEDIA OBJECT:', removedItem);

                        console.log('SERVER MEDIA ID:', serverMediaId);

                        console.log('IS SERVER MEDIA:', isExistingServerMedia);

                        console.log('==================================');

                        if (isExistingServerMedia) {
                          setRemovedMedia(current => [
                            ...current,
                            {
                              ...removedItem,

                              isServerMedia: true,

                              id: serverMediaId,

                              media_id: removedItem?.media_id ?? serverMediaId,

                              checklist_media_id:
                                removedItem?.checklist_media_id ??
                                serverMediaId,

                              url: removedItem?.url || removedItem?.uri || '',

                              uri: removedItem?.uri || removedItem?.url || '',
                            },
                          ]);
                        }

                        // Immediately remove from UI
                        setMedia(current =>
                          current.filter(
                            (_, mediaIndex) => mediaIndex !== index,
                          ),
                        );
                      }}
                    >
                      <Text style={styles.removeMediaText}>×</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.mediaPickerText}>No files uploaded</Text>
            )}
          </View>

          {!isReadOnly && (
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.uploadButton}
              onPress={openUploadOptions}
              disabled={saving}
            >
              <Text style={styles.uploadButtonText}>Upload</Text>
            </TouchableOpacity>
          )}
        </View>

        <Modal
          visible={uploadMenuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setUploadMenuVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.uploadMenuBackdrop}
            onPress={() => setUploadMenuVisible(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={styles.uploadMenuCard}
              onPress={() => {}}
            >
              <Text style={styles.uploadMenuTitle}>Upload media</Text>

              <TouchableOpacity
                style={styles.uploadMenuOption}
                onPress={() => {
                  setUploadMenuVisible(false);
                  chooseMedia('camera', 'photo');
                }}
              >
                <Text style={styles.uploadMenuOptionText}>Camera Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.uploadMenuOption}
                onPress={() => {
                  setUploadMenuVisible(false);
                  chooseMedia('camera', 'video');
                }}
              >
                <Text style={styles.uploadMenuOptionText}>Camera Video</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.uploadMenuOption}
                onPress={() => {
                  setUploadMenuVisible(false);
                  chooseMedia('gallery', 'mixed');
                }}
              >
                <Text style={styles.uploadMenuOptionText}>
                  Gallery Photo + Video
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.uploadMenuCancel}
                onPress={() => setUploadMenuVisible(false)}
              >
                <Text style={styles.uploadMenuCancelText}>Cancel</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        <Modal
          visible={Boolean(previewMedia)}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewMedia(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.previewBackdrop}
            onPress={() => setPreviewMedia(null)}
          >
            <View style={styles.previewCard}>
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.previewCloseButton}
                onPress={() => setPreviewMedia(null)}
              >
                <Text style={styles.previewCloseText}>✕</Text>
              </TouchableOpacity>

              {previewMedia?.type === 'video' ? (
                <Video
                  source={{ uri: previewMedia.uri }}
                  style={styles.previewMedia}
                  resizeMode="contain"
                  controls
                  paused
                />
              ) : (
                <Image
                  source={{ uri: previewMedia?.uri }}
                  style={styles.previewMedia}
                  resizeMode="contain"
                />
              )}
            </View>
          </TouchableOpacity>
        </Modal>

        {!isReadOnly && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={saveRoom}
            disabled={saving}
          >
            {saving ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />

                <Text style={styles.saveText}>
                  {isEditMode ? 'Updating...' : 'Saving...'}
                </Text>
              </>
            ) : (
              <Text style={styles.saveText}>
                {isEditMode ? 'Update' : 'Save'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default RoomLogScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  content: {
    padding: 16,
    paddingBottom: 110,
  },

  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#849890',
    marginTop: 20,
    marginBottom: 9,
  },

  dateValue: {
    height: 52,
    borderWidth: 1,
    borderColor: '#D9E5DE',
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 15,
  },

  dateValueText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#617970',
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#D9E5DE',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    color: '#173A30',
    fontSize: 14,
  },

  logInput: {
    height: 150,
    borderWidth: 1,
    borderColor: '#D9E5DE',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 15,
    color: '#173A30',
    fontSize: 14,
    lineHeight: 21,
  },

  readOnlyInput: {
    backgroundColor: '#F0F6F2',
  },

  mediaPicker: {
    minHeight: 110,
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#9EDDBB',
    backgroundColor: '#F8FCF9',
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: 12,
    overflow: 'hidden',
  },

  mediaList: {
    minHeight: 82,
    justifyContent: 'center',
  },

  mediaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
    justifyContent: 'space-between',
  },

  mediaPreviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },

  mediaThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 8,
  },

  mediaVideoThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#287954',
  },

  mediaVideoIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  mediaFileName: {
    flex: 1,
    fontSize: 12,
    color: '#287954',
  },

  removeMediaButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  removeMediaText: {
    fontSize: 20,
    lineHeight: 22,
    color: '#C84F4F',
  },

  mediaPickerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#438B6D',
    textAlign: 'center',
    paddingHorizontal: 8,
  },

  uploadButton: {
    borderWidth: 1,
    borderColor: '#B9DCC8',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 12,
    alignSelf: 'flex-start',
  },

  uploadButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#287954',
  },

  uploadMenuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(9, 18, 15, 0.45)',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },

  uploadMenuCard: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },

  uploadMenuTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#173A30',
    marginBottom: 8,
  },

  uploadMenuOption: {
    minHeight: 48,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5EEE9',
  },

  uploadMenuOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#287954',
  },

  uploadMenuCancel: {
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: '#F0F6F2',
  },

  uploadMenuCancelText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#C84F4F',
  },

  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(9, 18, 15, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  previewCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    position: 'relative',
  },

  previewCloseButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  previewCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  previewMedia: {
    width: '100%',
    height: 420,
    backgroundColor: '#F3F5F4',
  },

  saveButton: {
    alignSelf: 'center',
    marginTop: 28,
    marginBottom: 24,
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  saveButtonDisabled: {
    opacity: 0.65,
  },

  saveText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
