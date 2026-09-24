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
  ActivityIndicator,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';
import Video from 'react-native-video';
import PageHeader from '../components/PageHeader';

const STORAGE_KEY = 'dailyCleaningRooms';

const PRIMARY = '#176B50';
const BACKGROUND = '#F4F8F5';

const CREATE_API =
  'https://staysereno.in/api/staff/daily-cleaning-checklist';

const getDateKey = date => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getStoredMedia = room => {
  if (Array.isArray(room?.media)) {
    return room.media;
  }

  return room?.mediaUri
    ? [
        {
          uri: room.mediaUri,
          type: room.mediaType || 'photo',
          fileName: room.mediaName || 'Uploaded file',
          isServerMedia: true,
        },
      ]
    : [];
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

const RoomLogScreen = ({navigation, route}) => {
  const existingRoom = route?.params?.room;

  const todayKey = getDateKey(new Date());

  const date =
    route?.params?.date ||
    existingRoom?.date ||
    '';

  const [dateRoom, setDateRoom] = useState(null);

  const displayedRoom = existingRoom || dateRoom;

  const [title, setTitle] = useState(
    existingRoom?.title ||
      route?.params?.sectionTitle ||
      '',
  );

  const [description, setDescription] = useState(
    existingRoom?.description ||
      '',
  );

  const [media, setMedia] = useState(
    getStoredMedia(existingRoom),
  );

  const [saving, setSaving] = useState(false);

  const isReadOnly = date !== todayKey;

  const isEditMode = Boolean(
    getChecklistId(displayedRoom),
  );

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

    console.log(
      'ROOM LOG RESOLVE SECTION ID:',
      {
        routeParams: route?.params,
        displayedRoom,
        directId,
      },
    );

    if (
      directId !== null &&
      directId !== undefined &&
      directId !== ''
    ) {
      return Number(directId);
    }

    const storedRooms =
      route?.params?.storedRooms || [];

    const matchingStoredRoom =
      storedRooms.find(item => {
        return (
          String(item?.date || '') ===
            String(date) &&
          String(item?.title || '') ===
            String(
              title ||
                route?.params?.sectionTitle ||
                '',
            )
        );
      });

    const fallbackId =
      matchingStoredRoom?.sectionId ??
      matchingStoredRoom?.section_id ??
      null;

    return fallbackId !== null &&
      fallbackId !== undefined &&
      fallbackId !== ''
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
        const storedRooms =
          await AsyncStorage.getItem(
            STORAGE_KEY,
          );

        const rooms = storedRooms
          ? JSON.parse(storedRooms)
          : [];

        const room = rooms.find(
          item =>
            String(item?.property || '') ===
              String(
                route?.params?.property || '',
              ) &&
            String(item?.date || '') ===
              String(date) &&
            String(item?.title || '') ===
              String(
                route?.params?.sectionTitle ||
                  '',
              ),
        );

        setDateRoom(room || null);
      } catch (error) {
        console.log(
          'LOAD ROOM ERROR:',
          error,
        );

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
    console.log(
      'ROOM LOG DISPLAYED ROOM:',
      {
        existingRoom,
        dateRoom,
        displayedRoom,
      },
    );

    if (!displayedRoom) {
      setTitle(
        route?.params?.sectionTitle || '',
      );
      setDescription('');
      setMedia([]);
      return;
    }

    setTitle(
      displayedRoom.title ||
        route?.params?.sectionTitle ||
        '',
    );

    setDescription(
      displayedRoom.description || '',
    );

    setMedia(
      getStoredMedia(displayedRoom),
    );
  }, [
    displayedRoom,
    route?.params?.sectionTitle,
  ]);

  // =========================================================
  // TOKEN
  // =========================================================

  const getAuthToken = async () => {
    const keys = [
      'authToken',
      'token',
      'access_token',
      'userToken',
    ];

    for (const key of keys) {
      const value =
        await AsyncStorage.getItem(key);

      if (
        value &&
        value.trim()
      ) {
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
      if (
  candidate === null ||
  candidate === undefined
) {
  continue;
}

      const stringCandidate =
        String(candidate).trim();

      if (
        /^\d+$/.test(
          stringCandidate,
        )
      ) {
        return stringCandidate;
      }

      try {
        const parsed =
          typeof candidate === 'string'
            ? JSON.parse(candidate)
            : candidate;

        const id =
          parsed?.id ??
          parsed?.user_id ??
          parsed?.userId ??
          parsed?.data?.id ??
          parsed?.data?.user_id ??
          parsed?.data?.userId ??
          null;

        if (
          id !== null &&
          id !== undefined &&
          id !== ''
        ) {
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

  const resolveStoredPropertyId =
    async () => {
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

        await AsyncStorage.getItem(
          'dailyCleaningSelectedPropertyId',
        ),

        await AsyncStorage.getItem(
          'selectedPropertyId',
        ),
      ];

      for (const candidate of candidates) {
        if (
          candidate !== null &&
          candidate !== undefined &&
          candidate !== ''
        ) {
          return String(candidate);
        }
      }

      return null;
    };

  // =========================================================
  // MEDIA PICKER
  // =========================================================

  const chooseMedia = async source => {
    if (isReadOnly || saving) {
      return;
    }

    try {
      const picker =
        source === 'camera'
          ? launchCamera
          : launchImageLibrary;

      const result = await picker({
        mediaType: 'mixed',
        selectionLimit:
          source === 'camera' ? 1 : 0,
        videoQuality: 'low',
      });

      if (result?.didCancel) {
        return;
      }

      if (result?.errorCode) {
        Alert.alert(
          'Upload error',
          result?.errorMessage ||
            'Unable to select media.',
        );
        return;
      }

      const selectedMedia =
        (result.assets || [])
          .filter(asset => asset?.uri)
          .map(asset => ({
            uri: asset.uri,

            type: asset.type?.startsWith(
              'video',
            )
              ? 'video'
              : 'photo',

            fileName:
              asset.fileName ||
              asset.uri
                .split('/')
                .pop() ||
              'Uploaded file',

            width: asset.width,
            height: asset.height,

            // New local file
            isServerMedia: false,
          }));

      if (selectedMedia.length) {
        setMedia(currentMedia => [
          ...currentMedia,
          ...selectedMedia,
        ]);
      }
    } catch (error) {
      console.log(
        'MEDIA PICK ERROR:',
        error,
      );

      Alert.alert(
        'Upload error',
        'Unable to select media.',
      );
    }
  };

  // =========================================================
  // UPLOAD OPTIONS
  // =========================================================

  const openUploadOptions = () => {
    if (isReadOnly || saving) {
      return;
    }

    Alert.alert(
      'Upload',
      'Choose a source',
      [
        {
          text: 'Camera',
          onPress: () =>
            chooseMedia('camera'),
        },
        {
          text: 'Gallery',
          onPress: () =>
            chooseMedia('gallery'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
    );
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
    const validMedia = media.filter(
      item => item?.uri,
    );

    const formData = new FormData();

    formData.append(
      'user_id',
      String(Number(userId)),
    );

    formData.append(
      'unit_id',
      String(Number(propertyId)),
    );

    formData.append(
      'section',
      String(Number(sectionId)),
    );

    formData.append(
      'comment',
      comment,
    );

    validMedia.forEach(
      (item, index) => {
        const uri = item.uri;

        const fileName =
          item.fileName ||
          uri.split('/').pop() ||
          `media_${index}`;

        const type =
          item.type === 'video'
            ? 'video/mp4'
            : 'image/jpeg';

        formData.append(
          `media[${index}]`,
          {
            uri,
            name: fileName,
            type,
          },
        );
      },
    );

    console.log(
      'DAILY CHECKLIST CREATE REQUEST:',
      {
        user_id: userId,
        unit_id: propertyId,
        section: sectionId,
        comment,
        mediaCount: validMedia.length,
      },
    );

    const response =
      await fetch(CREATE_API, {
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

    const responseText =
      await response.text();

    console.log(
      'CREATE STATUS:',
      response.status,
    );

    console.log(
      'CREATE RESPONSE:',
      responseText,
    );

    let responseData = null;

    try {
      responseData = responseText
        ? JSON.parse(responseText)
        : null;
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

  const newMedia = media.filter(item => !item?.isServerMedia);

  const existingMedia = media.filter(item => item?.isServerMedia);

  console.log('========== UPDATE CHECKLIST ==========');
  console.log('URL:', url);
  console.log('CHECKLIST ID:', checklistId);
  console.log('USER ID:', userId);
  console.log('UNIT ID:', propertyId);
  console.log('SECTION ID:', sectionId);
  console.log('COMMENT:', comment);
  console.log('NEW MEDIA:', newMedia.length);
  console.log('EXISTING MEDIA:', existingMedia.length);
  console.log('======================================');

  /*
   * IMPORTANT:
   * Laravel/PHP often does not parse multipart/form-data
   * correctly with PUT.
   *
   * So use POST + _method=PUT.
   */

  const formData = new FormData();

  formData.append('_method', 'PUT');

  formData.append('user_id', String(userId));
  formData.append('unit_id', String(propertyId));
  formData.append('section', String(sectionId));
  formData.append('comment', String(comment || ''));

  /*
   * Existing server media
   */
  existingMedia.forEach((item, index) => {
    formData.append(
      `existing_media[${index}][file_name]`,
      String(
        item?.fileName ||
          item?.file_name ||
          item?.name ||
          'Uploaded file',
      ),
    );

    formData.append(
      `existing_media[${index}][type]`,
      item?.type === 'video' ? 'video' : 'image',
    );
  });

  /*
   * New media
   */
  newMedia.forEach((item, index) => {
    if (!item?.uri) {
      return;
    }

    const isVideo =
      item?.type === 'video' ||
      item?.mime?.startsWith?.('video/');

    const fileType = isVideo ? 'video' : 'image';

    formData.append(`media[${index}]`, {
      uri: item.uri,
      type:
        item?.type && item.type.includes('/')
          ? item.type
          : isVideo
          ? 'video/mp4'
          : 'image/jpeg',
      name:
        item?.fileName ||
        item?.file_name ||
        `checklist_${Date.now()}_${index}.${
          isVideo ? 'mp4' : 'jpg'
        }`,
    });

    formData.append(`media_type[${index}]`, fileType);
  });

  console.log('UPDATE METHOD: POST + _method=PUT');
  console.log('FORM USER ID:', String(userId));
  console.log('FORM UNIT ID:', String(propertyId));
  console.log('FORM SECTION:', String(sectionId));
  console.log('FORM COMMENT:', String(comment || ''));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      // IMPORTANT:
      // Content-Type manually mat lagana.
      // React Native boundary khud set karega.
    },
    body: formData,
  });

  console.log('UPDATE MULTIPART STATUS:', response.status);

  const responseText = await response.text();

  console.log(
    'UPDATE MULTIPART RESPONSE:',
    responseText,
  );

  let responseData = null;

  try {
    responseData = JSON.parse(responseText);
  } catch (e) {
    throw new Error(
      responseText || 'Invalid server response.',
    );
  }

  if (!response.ok || responseData?.status === false) {
    const validationErrors = responseData?.errors;

    if (validationErrors) {
      const errorMessages = Object.entries(validationErrors)
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

  // =========================================================
  // SAVE ROOM
  // =========================================================
const saveRoom = async () => {
  if (isReadOnly || saving) {
    return;
  }

  const normalizedComment =
    (description || '').trim();

  if (
    !date ||
    !title.trim() ||
    !normalizedComment
  ) {
    Alert.alert(
      'Missing details',
      'Please add a date, section, and comment.',
    );
    return;
  }

  const propertyId =
    await resolveStoredPropertyId();

  const sectionId =
    resolveSectionId();

  const userId =
    await resolveStoredUserId();

  const token =
    await getAuthToken();

  // ---------------------------------------------------------
  // CURRENT CHECKLIST ID
  // ---------------------------------------------------------

  const currentChecklistId =
    getChecklistId(displayedRoom);

  console.log(
    'ROOM LOG SAVE FINAL VALUES:',
    {
      date,
      title,
      propertyId,
      sectionId,
      userId,
      checklistId: currentChecklistId,
      comment: normalizedComment,
      mediaCount: media.length,
      isEditMode,
    },
  );

  if (
    !propertyId ||
    !userId ||
    !sectionId
  ) {
    console.log(
      'ROOM LOG SAVE BLOCKED:',
      {
        propertyId,
        userId,
        sectionId,
        displayedRoom,
        routeParams: route?.params,
      },
    );

    Alert.alert(
      'Missing required data',
      'Property, user, or section information is missing. Please reopen this room from the daily cleaning screen.',
    );

    return;
  }

  if (!token) {
    Alert.alert(
      'Session expired',
      'Please login again and try once more.',
    );
    return;
  }

  try {
    setSaving(true);

    let responseData = null;

    // =======================================================
    // EDIT -> PUT
    // =======================================================

    if (currentChecklistId) {
      console.log(
        'EDIT MODE -> PUT',
        {
          checklistId: currentChecklistId,
        },
      );

      responseData =
        await updateChecklist({
          checklistId: currentChecklistId,
          userId,
          propertyId,
          sectionId,
          comment: normalizedComment,
          token,
        });
    }

    // =======================================================
    // ADD -> POST
    // =======================================================

    else {
      console.log(
        'ADD MODE -> POST',
      );

      responseData =
        await createChecklist({
          userId,
          propertyId,
          sectionId,
          comment: normalizedComment,
          token,
        });
    }

    // =======================================================
    // GET CHECKLIST ID FROM RESPONSE
    // =======================================================

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

    console.log(
      'FINAL CHECKLIST ID:',
      apiChecklistId,
    );

    // =======================================================
    // LOAD LOCAL STORAGE
    // =======================================================

    const storedRooms =
      await AsyncStorage.getItem(
        STORAGE_KEY,
      );

    const rooms = storedRooms
      ? JSON.parse(storedRooms)
      : [];

    // =======================================================
    // STABLE LOCAL ID
    // =======================================================

    const localRoomId =
      displayedRoom?.id ??
      displayedRoom?.roomId ??
      apiChecklistId ??
      `${Date.now()}`;

    // =======================================================
    // ROOM OBJECT
    // =======================================================

    const room = {
      id: String(localRoomId),

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

      property:
        route?.params?.property ||
        displayedRoom?.property ||
        '',

      propertyId:
        String(propertyId),

      unit_id:
        String(propertyId),

      sectionId:
        Number(sectionId),

      section_id:
        Number(sectionId),

      date,

      title:
        title.trim(),

      description:
        normalizedComment,

      media,

      mediaUri:
        media[0]?.uri || '',

      mediaType:
        media[0]?.type || '',

      mediaName:
        media[0]?.fileName || '',
    };

    // =======================================================
    // FIND EXISTING ROW
    // =======================================================

    const existingIndex =
      rooms.findIndex(item => {
        // ---------------------------------------------------
        // 1. FIRST PRIORITY: CHECKLIST ID
        // ---------------------------------------------------

        if (
          apiChecklistId !== null &&
          apiChecklistId !== undefined &&
          apiChecklistId !== ''
        ) {
          const itemChecklistId =
            item?.checklistId ??
            item?.checklist_id ??
            item?.daily_cleaning_checklist_id ??
            item?.dailyCleaningChecklistId ??
            item?.apiId ??
            null;

          if (
            itemChecklistId !== null &&
            itemChecklistId !== undefined &&
            itemChecklistId !== '' &&
            String(itemChecklistId) ===
              String(apiChecklistId)
          ) {
            return true;
          }
        }

        // ---------------------------------------------------
        // 2. SECOND PRIORITY: LOCAL ROOM ID
        // ---------------------------------------------------

        if (
          displayedRoom?.id !== null &&
          displayedRoom?.id !== undefined &&
          displayedRoom?.id !== ''
        ) {
          if (
            String(item?.id) ===
            String(displayedRoom.id)
          ) {
            return true;
          }
        }

        // ---------------------------------------------------
        // 3. FINAL FALLBACK:
        // SAME PROPERTY + DATE + SECTION
        // ---------------------------------------------------

        const itemPropertyId =
          item?.propertyId ??
          item?.unit_id ??
          item?.unitId ??
          null;

        const itemSectionId =
          item?.sectionId ??
          item?.section_id ??
          null;

        const sameProperty =
          itemPropertyId !== null &&
          String(itemPropertyId) ===
            String(propertyId);

        const sameDate =
          String(item?.date || '') ===
          String(date);

        const sameSection =
          itemSectionId !== null &&
          String(itemSectionId) ===
            String(sectionId);

        return (
          sameProperty &&
          sameDate &&
          sameSection
        );
      });

    // =======================================================
    // UPDATE EXISTING OR CREATE NEW
    // =======================================================

    let updatedRooms;

    if (existingIndex !== -1) {
      // -----------------------------------------------------
      // EXISTING PMS ROW
      // -----------------------------------------------------

      updatedRooms = [...rooms];

      updatedRooms[existingIndex] = {
        ...rooms[existingIndex],
        ...room,

        // Preserve local ID
        id:
          rooms[existingIndex]?.id ||
          room.id,

        // Preserve checklist ID
        checklistId:
          room.checklistId ||
          rooms[existingIndex]?.checklistId ||
          null,

        checklist_id:
          room.checklist_id ||
          rooms[existingIndex]?.checklist_id ||
          null,
      };

      console.log(
        'PMS EXISTING ROW UPDATED:',
        {
          existingIndex,
          oldRow:
            rooms[existingIndex],
          newRow:
            updatedRooms[existingIndex],
        },
      );
    } else {
      // -----------------------------------------------------
      // NEW PMS ROW
      // -----------------------------------------------------

      updatedRooms = [
        ...rooms,
        room,
      ];

      console.log(
        'PMS NEW ROW CREATED:',
        room,
      );
    }

    // =======================================================
    // SAVE STORAGE
    // =======================================================

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updatedRooms),
    );

    console.log(
      'FINAL DAILY CLEANING ROOMS:',
      updatedRooms,
    );

    Alert.alert(
      currentChecklistId
        ? 'Updated'
        : 'Saved',

      currentChecklistId
        ? 'Cleaning checklist updated successfully.'
        : 'Cleaning checklist saved successfully.',

      [
        {
          text: 'OK',
          onPress: () =>
            navigation.goBack(),
        },
      ],
    );
  } catch (error) {
    console.log(
      'DAILY CHECKLIST SAVE/UPDATE ERROR:',
      error,
    );

    Alert.alert(
      currentChecklistId
        ? 'Update failed'
        : 'Save failed',

      error?.message ||
        'Please try again.',
    );
  } finally {
    setSaving(false);
  }
};

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <SafeAreaView
      style={styles.container}>
      <PageHeader
        navigation={navigation}
        title={
          isEditMode
            ? 'Edit cleaning checklist'
            : 'Daily cleaning checklist'
        }
        showMenu={false}
      />

      <ScrollView
        contentContainerStyle={
          styles.content
        }
        keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>
          CLEANING DATE
        </Text>

        <View
          style={[
            styles.dateValue,
            styles.readOnlyInput,
          ]}>
          <Text
            style={
              styles.dateValueText
            }>
            {date}
          </Text>
        </View>

        <Text style={styles.label}>
          SECTION
        </Text>

        <TextInput
          editable={false}
          value={title}
          placeholder="Selected section"
          placeholderTextColor="#9AAEA4"
          style={[
            styles.input,
            styles.readOnlyInput,
          ]}
        />

        <Text style={styles.label}>
          COMMENT
        </Text>

        <TextInput
          editable={
            !isReadOnly && !saving
          }
          multiline
          value={description}
          onChangeText={
            setDescription
          }
          placeholder="Add a comment about the cleaning..."
          placeholderTextColor="#9AAEA4"
          style={[
            styles.logInput,
            isReadOnly &&
              styles.readOnlyInput,
          ]}
          textAlignVertical="top"
        />

        <Text style={styles.label}>
          UPLOAD
        </Text>

        <View
          style={[
            styles.mediaPicker,
            isReadOnly &&
              styles.readOnlyInput,
          ]}>
          <View
            style={styles.mediaList}>
            {media.length ? (
              media.map(
                (item, index) => (
                  <View
                    key={`${item.uri}-${index}`}
                    style={
                      styles.mediaRow
                    }>
                    {item.type ===
                    'photo' ? (
                      <Image
                        source={{
                          uri: item.uri,
                        }}
                        style={
                          styles.mediaThumbnail
                        }
                      />
                    ) : (
                      <Video
                        source={{
                          uri: item.uri,
                        }}
                        style={
                          styles.mediaThumbnail
                        }
                        resizeMode="cover"
                        paused
                        muted
                      />
                    )}

                    <Text
                      style={
                        styles.mediaFileName
                      }
                      numberOfLines={1}>
                      {item.fileName ||
                        item.file_name ||
                        'Uploaded file'}
                    </Text>

                    {!isReadOnly && (
                      <TouchableOpacity
                        activeOpacity={
                          0.8
                        }
                        style={
                          styles.removeMediaButton
                        }
                        onPress={() =>
                          setMedia(
                            current =>
                              current.filter(
                                (
                                  _,
                                  mediaIndex,
                                ) =>
                                  mediaIndex !==
                                  index,
                              ),
                          )
                        }>
                        <Text
                          style={
                            styles.removeMediaText
                          }>
                          ×
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ),
              )
            ) : (
              <Text
                style={
                  styles.mediaPickerText
                }>
                No files uploaded
              </Text>
            )}
          </View>

          {!isReadOnly && (
            <TouchableOpacity
              activeOpacity={0.8}
              style={
                styles.uploadButton
              }
              onPress={
                openUploadOptions
              }
              disabled={saving}>
              <Text
                style={
                  styles.uploadButtonText
                }>
                Upload
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {!isReadOnly && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.saveButton,
              saving &&
                styles.saveButtonDisabled,
            ]}
            onPress={saveRoom}
            disabled={saving}>
            {saving ? (
              <>
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.saveText
                  }>
                  {isEditMode
                    ? 'Updating...'
                    : 'Saving...'}
                </Text>
              </>
            ) : (
              <Text
                style={
                  styles.saveText
                }>
                {isEditMode
                  ? 'Update'
                  : 'Save'}
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
    backgroundColor:
      BACKGROUND,
  },

  content: {
    padding: 16,
    paddingBottom: 36,
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    overflow: 'hidden',
  },

  mediaList: {
    flex: 1,
    minHeight: 82,
    justifyContent: 'center',
  },

  mediaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },

  mediaThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 8,
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
    backgroundColor:
      '#FDECEC',
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
  },

  uploadButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#287954',
  },

  saveButton: {
    alignSelf: 'flex-start',
    marginTop: 28,
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