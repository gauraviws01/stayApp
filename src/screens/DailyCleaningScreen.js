import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Video from 'react-native-video';
import Svg, {Path} from 'react-native-svg';
import {useFocusEffect} from '@react-navigation/native';

import PropertyDropdown from '../components/PropertyDropdown';
import EyeIcon from '../components/EyeIcon';
import EditIcon from '../components/EditIcon';

const PRIMARY = '#17B978';
const BACKGROUND = '#F4F8F5';

const PROPERTY_API =
  'http://staysereno.in/api/staff/properties';

const CHECKLIST_API =
  'http://staysereno.in/api/staff/daily-cleaning-checklist';

const ROOMS_STORAGE_KEY = 'dailyCleaningRooms';
const SELECTED_PROPERTY_KEY =
  'dailyCleaningSelectedPropertyId';

// ========================================
// DATE KEY
// ========================================

const getDateKey = date => {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0');

  const day = String(
    date.getDate(),
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

// ========================================
// CALENDAR DAYS
// ========================================

const getCalendarDays = monthDate => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const firstDay = new Date(
    year,
    month,
    1,
  );

  const lastDay = new Date(
    year,
    month + 1,
    0,
  );

  const cells = Array.from(
    {
      length: firstDay.getDay(),
    },
    () => null,
  );

  for (
    let day = 1;
    day <= lastDay.getDate();
    day += 1
  ) {
    cells.push(
      new Date(
        year,
        month,
        day,
      ),
    );
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
};

// ========================================
// STRIP HTML
// ========================================

const stripHtml = html => {
  if (!html) {
    return '';
  }

  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n\s*\n+/g, '\n')
    .trim();
};

// ========================================
// ROOM MEDIA
// ========================================

const getRoomMedia = room => {
  if (Array.isArray(room?.media)) {
    return room.media;
  }

  if (Array.isArray(room?.medias)) {
    return room.medias;
  }

  if (Array.isArray(room?.images)) {
    return room.images;
  }

  if (room?.mediaUri) {
    return [
      {
        uri: room.mediaUri,
        type:
          room.mediaType ||
          'photo',
        fileName:
          room.mediaName ||
          'Uploaded file',
      },
    ];
  }

  return [];
};

// ========================================
// PROPERTY NAME
// ========================================

const getPropertyName = property =>
  property?.final_unit_name ||
  property?.unit_name ||
  property?.unitName ||
  property?.property_name ||
  property?.propertyName ||
  property?.name ||
  property?.title ||
  '';

// ========================================
// SECTION NAME
// ========================================

const getSectionName = section =>
  section?.name ||
  section?.title ||
  section?.section_name ||
  'Untitled Section';

// ========================================
// SECTION DESCRIPTION
// ========================================

const getSectionDescription = section =>
  stripHtml(
    section?.description || '',
  );

// ========================================
// CALENDAR ICON
// ========================================

const CalendarIcon = () => (
  <Svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none">
    <Path
      d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
      stroke="#287954"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ========================================
// EXTRACT CHECKLIST ARRAY
// ========================================

const extractChecklistArray = responseData => {
  if (!responseData) {
    return [];
  }

  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (
    Array.isArray(responseData?.data)
  ) {
    return responseData.data;
  }

  if (
    Array.isArray(responseData?.checklists)
  ) {
    return responseData.checklists;
  }

  if (
    Array.isArray(
      responseData?.daily_cleaning_checklist,
    )
  ) {
    return responseData.daily_cleaning_checklist;
  }

  if (
    Array.isArray(
      responseData?.daily_cleaning_checklists,
    )
  ) {
    return responseData.daily_cleaning_checklists;
  }

  if (
    Array.isArray(responseData?.result)
  ) {
    return responseData.result;
  }

  if (
    Array.isArray(
      responseData?.data?.checklists,
    )
  ) {
    return responseData.data.checklists;
  }

  if (
    Array.isArray(
      responseData?.data
        ?.daily_cleaning_checklist,
    )
  ) {
    return responseData.data.daily_cleaning_checklist;
  }

  if (
    Array.isArray(
      responseData?.data
        ?.daily_cleaning_checklists,
    )
  ) {
    return responseData.data.daily_cleaning_checklists;
  }

  return [];
};

// ========================================
// NORMALIZE CHECKLIST RECORD
// ========================================

const normalizeChecklistRecord = (
  item,
  selectedPropertyId,
  selectedDate,
) => {
  if (!item) {
    return null;
  }

  const sectionObject =
    item?.section &&
    typeof item.section === 'object'
      ? item.section
      : null;

  const sectionId =
    item?.sectionId ??
    item?.section_id ??
    item?.sectionID ??
    item?.home_section_id ??
    sectionObject?.id ??
    null;

  const propertyId =
    item?.unit_id ??
    item?.unitId ??
    item?.property_id ??
    item?.propertyId ??
    item?.unit?.id ??
    selectedPropertyId ??
    null;

  const recordDate =
    item?.date ??
    item?.checklist_date ??
    item?.cleaning_date ??
    item?.cleaningDate ??
    item?.created_date ??
    selectedDate;

  const description =
    item?.description ??
    item?.comment ??
    item?.comments ??
    item?.remarks ??
    item?.note ??
    '';

  const media =
    item?.media ??
    item?.medias ??
    item?.images ??
    item?.files ??
    [];

  return {
    ...item,

    checklistId:
      item?.checklistId ??
      item?.checklist_id ??
      item?.daily_cleaning_checklist_id ??
      item?.dailyCleaningChecklistId ??
      item?.id ??
      null,

    checklist_id:
      item?.checklist_id ??
      item?.checklistId ??
      item?.daily_cleaning_checklist_id ??
      item?.dailyCleaningChecklistId ??
      item?.id ??
      null,

    propertyId: propertyId,
    property_id: propertyId,
    unit_id:
      item?.unit_id ??
      propertyId,

    sectionId: sectionId,
    section_id: sectionId,

    date: recordDate,

    description: description,
    comment:
      item?.comment ??
      description,

    media: Array.isArray(media)
      ? media
      : [],
  };
};

// ========================================
// SCREEN
// ========================================

const DailyCleaningScreen = ({
  navigation,
}) => {
  // ======================================
  // PROPERTY STATES
  // ======================================

  const [
    roomsLoading,
    setRoomsLoading,
  ] = useState(false);

  const [
    properties,
    setProperties,
  ] = useState([]);

  const [
    selectedProperty,
    setSelectedProperty,
  ] = useState('');

  const [
    selectedPropertyId,
    setSelectedPropertyId,
  ] = useState(null);

  const [
    propertyLoading,
    setPropertyLoading,
  ] = useState(true);

  // ======================================
  // OTHER STATES
  // ======================================

  const [
    selectedDate,
    setSelectedDate,
  ] = useState('');

  const [
    calendarVisible,
    setCalendarVisible,
  ] = useState(false);

  const [
    calendarMonth,
    setCalendarMonth,
  ] = useState(() => {
    const today = new Date();

    return new Date(
      today.getFullYear(),
      today.getMonth(),
      1,
    );
  });

  const [
    savedRooms,
    setSavedRooms,
  ] = useState([]);

  const [
    activeMedia,
    setActiveMedia,
  ] = useState(null);

  const [
    activeMediaItem,
    setActiveMediaItem,
  ] = useState(null);

  const [
    videoAspectRatio,
    setVideoAspectRatio,
  ] = useState(16 / 9);

  const [
    apiLoading,
    setApiLoading,
  ] = useState(false);

  // ======================================
  // TODAY
  // ======================================

  const todayKey = getDateKey(
    new Date(),
  );

  // ======================================
  // CALENDAR
  // ======================================

  const calendarDates = useMemo(
    () =>
      getCalendarDays(
        calendarMonth,
      ),
    [calendarMonth],
  );

  // ======================================
  // SELECTED PROPERTY OBJECT
  // ======================================

  const selectedPropertyObject =
    useMemo(() => {
      if (
        !selectedPropertyId ||
        !Array.isArray(properties)
      ) {
        return null;
      }

      return (
        properties.find(
          item =>
            String(
              item?.unit_id ??
                item?.id,
            ) ===
            String(
              selectedPropertyId,
            ),
        ) || null
      );
    }, [
      properties,
      selectedPropertyId,
    ]);

  // ======================================
  // DYNAMIC HOME SECTIONS
  // ======================================

  const sections = useMemo(() => {
    if (
      !selectedPropertyObject ||
      !Array.isArray(
        selectedPropertyObject.home_sections,
      )
    ) {
      return [];
    }

    return selectedPropertyObject.home_sections
      .filter(section => {
        if (!section) {
          return false;
        }

        if (
          section.status !==
            undefined &&
          section.status !== null &&
          Number(section.status) !== 1
        ) {
          return false;
        }

        return true;
      })
      .map(section => ({
        ...section,

        title:
          getSectionName(section),

        description:
          getSectionDescription(
            section,
          ),
      }));
  }, [
    selectedPropertyObject,
  ]);

  // ======================================
  // GET AUTH TOKEN
  // ======================================

  const getAuthToken =
    useCallback(async () => {
      const keys = [
        'authToken',
        'token',
        'access_token',
        'userToken',
      ];

      for (const key of keys) {
        const value =
          await AsyncStorage.getItem(
            key,
          );

        if (
          value &&
          value.trim()
        ) {
          return value.trim();
        }
      }

      return null;
    }, []);

  // ======================================
  // GET USER ID
  // ======================================

  const getUserId =
    useCallback(async () => {
      let userId =
        await AsyncStorage.getItem(
          'userId',
        );

      if (
        userId !== null &&
        userId !== undefined &&
        userId !== ''
      ) {
        return userId;
      }

      const userDataString =
        await AsyncStorage.getItem(
          'userData',
        );

      if (userDataString) {
        try {
          const userData =
            JSON.parse(
              userDataString,
            );

          userId =
            userData?.id ??
            userData?.user_id ??
            userData?.userId ??
            null;
        } catch (error) {
          console.log(
            'USER DATA PARSE ERROR:',
            error,
          );
        }
      }

      return userId;
    }, []);

  // ======================================
  // SESSION EXPIRED
  // ======================================

  const authExpiredAlertShownRef =
    useRef(false);

  const handleSessionExpired =
    useCallback(async () => {
      if (
        authExpiredAlertShownRef.current
      ) {
        return;
      }

      authExpiredAlertShownRef.current =
        true;

      await AsyncStorage.multiRemove([
        'authToken',
        'token',
        'access_token',
        'userToken',
      ]);

      setProperties([]);
      setSelectedProperty('');
      setSelectedPropertyId(null);
      setSavedRooms([]);

      Alert.alert(
        'Session expired',
        'Please login again.',
      );
    }, []);

  // ======================================
  // LOAD PROPERTIES
  // ======================================

  const loadProperties =
    useCallback(async () => {
      try {
        setPropertyLoading(true);

        const token =
          await getAuthToken();

        console.log(
          'PROPERTY API TOKEN EXISTS:',
          !!token,
        );

        if (!token) {
          setProperties([]);
          setSelectedProperty('');
          setSelectedPropertyId(null);
          return;
        }

        const userId =
          await getUserId();

        console.log(
          'FINAL PROPERTY API USER ID:',
          userId,
        );

        const requestBody =
          userId !== null &&
          userId !== undefined &&
          userId !== ''
            ? {
                user_id:
                  Number(userId),
              }
            : {};

        console.log(
          'PROPERTY API REQUEST BODY:',
          requestBody,
        );

        const response =
          await fetch(
            PROPERTY_API,
            {
              method: 'POST',

              headers: {
                Accept:
                  'application/json',

                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify(
                requestBody,
              ),
            },
          );

        console.log(
          'PROPERTY API STATUS:',
          response.status,
        );

        const responseText =
          await response.text();

        console.log(
          'PROPERTY API RESPONSE:',
          responseText,
        );

        let responseData = null;

        try {
          responseData =
            JSON.parse(
              responseText,
            );
        } catch (error) {
          console.log(
            'PROPERTY JSON PARSE ERROR:',
            error,
          );
        }

        if (
          response.status === 401 ||
          responseData?.message ===
            'Unauthenticated.'
        ) {
          await handleSessionExpired();
          return;
        }

        if (!response.ok) {
          throw new Error(
            `Property API failed with status ${response.status}`,
          );
        }

        if (!responseData) {
          throw new Error(
            'Invalid property API response',
          );
        }

        let propertyList = [];

        if (
          Array.isArray(
            responseData,
          )
        ) {
          propertyList =
            responseData;
        } else if (
          Array.isArray(
            responseData?.properties,
          )
        ) {
          propertyList =
            responseData.properties;
        } else if (
          Array.isArray(
            responseData?.data,
          )
        ) {
          propertyList =
            responseData.data;
        } else if (
          Array.isArray(
            responseData?.data
              ?.properties,
          )
        ) {
          propertyList =
            responseData.data.properties;
        } else if (
          Array.isArray(
            responseData?.result,
          )
        ) {
          propertyList =
            responseData.result;
        }

        const normalizedProperties =
          propertyList
            .map(item => ({
              ...item,

              unit_id:
                item?.unit_id ??
                item?.id ??
                item?.property_id ??
                null,

              unit_name:
                item?.unit_name ??
                item?.final_unit_name ??
                item?.unitName ??
                item?.property_name ??
                item?.propertyName ??
                item?.name ??
                item?.title ??
                '',
            }))
            .filter(
              item =>
                item?.unit_id !==
                  undefined &&
                item?.unit_id !==
                  null,
            );

        console.log(
          'NORMALIZED PROPERTIES:',
          normalizedProperties,
        );

        setProperties(
          normalizedProperties,
        );

        if (
          normalizedProperties.length ===
          0
        ) {
          setSelectedProperty('');
          setSelectedPropertyId(null);
          return;
        }

        const savedPropertyId =
          await AsyncStorage.getItem(
            SELECTED_PROPERTY_KEY,
          );

        let selected = null;

        if (savedPropertyId) {
          selected =
            normalizedProperties.find(
              item =>
                String(
                  item.unit_id,
                ) ===
                String(
                  savedPropertyId,
                ),
            );
        }

        if (!selected) {
          selected =
            normalizedProperties[0];
        }

        const propertyName =
          getPropertyName(
            selected,
          );

        const propertyId =
          selected?.unit_id ??
          null;

        setSelectedProperty(
          propertyName,
        );

        setSelectedPropertyId(
          propertyId,
        );

        if (
          propertyId !==
            undefined &&
          propertyId !== null
        ) {
          await AsyncStorage.setItem(
            SELECTED_PROPERTY_KEY,
            String(propertyId),
          );
        }
      } catch (error) {
        console.log(
          'LOAD PROPERTIES ERROR:',
          error,
        );

        setProperties([]);
        setSelectedProperty('');
        setSelectedPropertyId(null);
      } finally {
        setPropertyLoading(false);
      }
    }, [
      getAuthToken,
      getUserId,
      handleSessionExpired,
    ]);

  // ======================================
  // LOAD LOCAL ROOMS
  // ======================================

  const loadLocalRooms =
    useCallback(async () => {
      try {
        setRoomsLoading(true);

        const storedRooms =
          await AsyncStorage.getItem(
            ROOMS_STORAGE_KEY,
          );

        if (!storedRooms) {
          setSavedRooms([]);
          return;
        }

        const parsedRooms =
          JSON.parse(
            storedRooms,
          );

        if (
          Array.isArray(parsedRooms)
        ) {
          setSavedRooms(
            parsedRooms,
          );
        } else {
          setSavedRooms([]);
        }
      } catch (error) {
        console.log(
          'LOAD LOCAL ROOMS ERROR:',
          error,
        );

        setSavedRooms([]);
      } finally {
        setRoomsLoading(false);
      }
    }, []);

  // ======================================
  // GET PREVIOUS DATE CHECKLIST
  // ======================================

  const loadPreviousDateChecklist =
    useCallback(async () => {
      if (
        !selectedDate ||
        !selectedPropertyId
      ) {
        return;
      }

      // ----------------------------------
      // ONLY PREVIOUS DATE
      // ----------------------------------

      if (
        selectedDate >= todayKey
      ) {
        return;
      }

      try {
        setApiLoading(true);

        console.log(
          '================================',
        );

        console.log(
          'GET PREVIOUS CHECKLIST',
        );

        console.log(
          'DATE:',
          selectedDate,
        );

        console.log(
          'PROPERTY ID:',
          selectedPropertyId,
        );

        const token =
          await getAuthToken();

        if (!token) {
          console.log(
            'NO AUTH TOKEN FOR CHECKLIST GET',
          );

          setSavedRooms([]);

          return;
        }

        const userId =
          await getUserId();

        if (
          userId === null ||
          userId === undefined ||
          userId === ''
        ) {
          console.log(
            'NO USER ID FOR CHECKLIST GET',
          );

          setSavedRooms([]);

          return;
        }

        // --------------------------------
        // GET API
        // --------------------------------

        const url =
          `${CHECKLIST_API}/${encodeURIComponent(
            userId,
          )}`;

        console.log(
          'CHECKLIST GET URL:',
          url,
        );

        const response =
          await fetch(
            url,
            {
              method: 'GET',

              headers: {
                Accept:
                  'application/json',

                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        console.log(
          'CHECKLIST GET STATUS:',
          response.status,
        );

        const responseText =
          await response.text();

        console.log(
          'CHECKLIST GET RESPONSE:',
          responseText,
        );

        let responseData = null;

        try {
          responseData =
            JSON.parse(
              responseText,
            );
        } catch (error) {
          console.log(
            'CHECKLIST GET JSON ERROR:',
            error,
          );
        }

        // --------------------------------
        // AUTH ERROR
        // --------------------------------

        if (
          response.status === 401 ||
          responseData?.message ===
            'Unauthenticated.'
        ) {
          await handleSessionExpired();
          return;
        }

        if (!response.ok) {
          throw new Error(
            `Checklist GET failed with status ${response.status}`,
          );
        }

        // --------------------------------
        // EXTRACT ARRAY
        // --------------------------------

        const rawChecklist =
          extractChecklistArray(
            responseData,
          );

        console.log(
          'RAW CHECKLIST ARRAY:',
          rawChecklist,
        );

        // --------------------------------
        // NORMALIZE
        // --------------------------------

        const normalizedChecklist =
          rawChecklist
            .map(item =>
              normalizeChecklistRecord(
                item,
                selectedPropertyId,
                selectedDate,
              ),
            )
            .filter(Boolean);

        console.log(
          'NORMALIZED CHECKLIST:',
          normalizedChecklist,
        );

        // --------------------------------
        // FILTER DATE + PROPERTY
        // --------------------------------

        const filteredChecklist =
          normalizedChecklist.filter(
            item => {
              // PROPERTY MATCH
              const itemPropertyId =
                item?.propertyId ??
                item?.property_id ??
                item?.unit_id;

              if (
                itemPropertyId !==
                  undefined &&
                itemPropertyId !==
                  null &&
                selectedPropertyId !==
                  undefined &&
                selectedPropertyId !==
                  null
              ) {
                if (
                  String(
                    itemPropertyId,
                  ) !==
                  String(
                    selectedPropertyId,
                  )
                ) {
                  return false;
                }
              }

              // DATE MATCH
              if (
                item?.date
              ) {
                const apiDate =
                  String(
                    item.date,
                  ).substring(
                    0,
                    10,
                  );

                if (
                  apiDate !==
                  selectedDate
                ) {
                  return false;
                }
              }

              return true;
            },
          );

        console.log(
          'FILTERED PREVIOUS CHECKLIST:',
          filteredChecklist,
        );

        setSavedRooms(
          filteredChecklist,
        );
      } catch (error) {
        console.log(
          'GET PREVIOUS CHECKLIST ERROR:',
          error,
        );

        setSavedRooms([]);
      } finally {
        setApiLoading(false);
      }
    }, [
      selectedDate,
      selectedPropertyId,
      todayKey,
      getAuthToken,
      getUserId,
      handleSessionExpired,
    ]);

  // ======================================
  // LOAD SCREEN DATA
  // ======================================

  useEffect(() => {
    loadProperties();
  }, [
    loadProperties,
  ]);

  // ======================================
  // DATE DEFAULT
  // ======================================

  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(
        todayKey,
      );
    }
  }, [
    selectedDate,
    todayKey,
  ]);

  // ======================================
  // DATE CHANGE
  // ======================================

  useEffect(() => {
    if (
      !selectedDate ||
      !selectedPropertyId
    ) {
      return;
    }

    if (
      selectedDate < todayKey
    ) {
      // Previous date = GET API
      loadPreviousDateChecklist();
    } else if (
      selectedDate === todayKey
    ) {
      // Today = local data
      loadLocalRooms();
    } else {
      // Future = nothing
      setSavedRooms([]);
    }
  }, [
    selectedDate,
    selectedPropertyId,
    todayKey,
    loadPreviousDateChecklist,
    loadLocalRooms,
  ]);

  // ======================================
  // REFRESH ON FOCUS
  // ======================================

  useFocusEffect(
    useCallback(() => {
      authExpiredAlertShownRef.current =
        false;

      loadProperties();

      if (
        selectedDate <
        todayKey
      ) {
        loadPreviousDateChecklist();
      } else {
        loadLocalRooms();
      }

      return undefined;
    }, [
      loadProperties,
      selectedDate,
      todayKey,
      loadPreviousDateChecklist,
      loadLocalRooms,
    ]),
  );

  // ======================================
  // DATE CONDITIONS
  // ======================================

  const isPastDate =
    Boolean(
      selectedDate &&
      selectedDate < todayKey,
    );

  const isToday =
    Boolean(
      selectedDate &&
      selectedDate === todayKey,
    );

  const isFutureDate =
    Boolean(
      selectedDate &&
      selectedDate > todayKey,
    );

  const showSections =
    Boolean(
      selectedProperty &&
      selectedDate,
    );

  // ======================================
  // FIND ROOM FOR SECTION
  // ======================================

  const getRoomForSection =
    useCallback(
      section => {
        if (!section) {
          return undefined;
        }

        return savedRooms.find(
          room => {
            // --------------------------
            // DATE
            // --------------------------

            if (
              room?.date
            ) {
              const roomDate =
                String(
                  room.date,
                ).substring(
                  0,
                  10,
                );

              if (
                roomDate !==
                selectedDate
              ) {
                return false;
              }
            }

            // --------------------------
            // PROPERTY
            // --------------------------

            const roomPropertyId =
              room?.propertyId ??
              room?.property_id ??
              room?.unit_id;

            if (
              roomPropertyId !==
                undefined &&
              roomPropertyId !==
                null &&
              selectedPropertyId !==
                undefined &&
              selectedPropertyId !==
                null
            ) {
              if (
                String(
                  roomPropertyId,
                ) !==
                String(
                  selectedPropertyId,
                )
              ) {
                return false;
              }
            }

            // --------------------------
            // SECTION ID
            // --------------------------

            const roomSectionId =
              room?.sectionId ??
              room?.section_id ??
              room?.home_section_id;

            if (
              roomSectionId !==
                undefined &&
              roomSectionId !==
                null &&
              section?.id !==
                undefined &&
              section?.id !==
                null
            ) {
              return (
                String(
                  roomSectionId,
                ) ===
                String(
                  section.id,
                )
              );
            }

            // --------------------------
            // SECTION TITLE FALLBACK
            // --------------------------

            const roomTitle =
              room?.title ||
              room?.sectionTitle ||
              room?.section_name ||
              room?.section?.name;

            if (
              roomTitle &&
              getSectionName(
                section,
              )
            ) {
              return (
                String(
                  roomTitle,
                ) ===
                String(
                  getSectionName(
                    section,
                  ),
                )
              );
            }

            return false;
          },
        );
      },
      [
        savedRooms,
        selectedDate,
        selectedPropertyId,
      ],
    );

  // ======================================
  // ADD ROOM
  // ======================================

  const openAddRoom =
    section => {
      if (!selectedProperty) {
        Alert.alert(
          'Select property',
          'Please select a property first.',
        );
        return;
      }

      // Previous + future blocked
      if (
        !selectedDate ||
        !isToday
      ) {
        return;
      }

      console.log(
        'OPEN ADD ROOM SECTION:',
        section,
      );

      console.log(
        'OPEN ADD ROOM SECTION ID:',
        section?.id ?? null,
      );

      navigation.navigate(
        'AddRoom',
        {
          property:
            selectedProperty,

          propertyId:
            selectedPropertyId,

          date:
            selectedDate,

          sectionId:
            section?.id ??
            null,

          sectionTitle:
            getSectionName(
              section,
            ),

          sectionDescription:
            getSectionDescription(
              section,
            ),

          section:
            section,

          readOnly: false,
        },
      );
    };

  // ======================================
  // EDIT / VIEW ROOM
  // ======================================

  const openEditRoom = (
    room,
    section,
  ) => {
    if (!selectedProperty) {
      Alert.alert(
        'Select property',
        'Please select a property first.',
      );

      return;
    }

    const resolvedChecklistId =
      room?.checklistId ??
      room?.checklist_id ??
      room?.daily_cleaning_checklist_id ??
      room?.dailyCleaningChecklistId ??
      room?.id ??
      null;

    const resolvedSectionId =
      room?.sectionId ??
      room?.section_id ??
      room?.home_section_id ??
      section?.id ??
      null;

    const resolvedSectionTitle =
      getSectionName(section) ||
      room?.title ||
      room?.sectionTitle ||
      room?.section_name ||
      '';

    const readOnly =
      isPastDate;

    console.log(
      'OPEN ROOM:',
      {
        room,
        section,
        resolvedChecklistId,
        resolvedSectionId,
        readOnly,
      },
    );

    navigation.navigate(
      'EditRoom',
      {
        room: {
          ...room,

          checklistId:
            resolvedChecklistId,

          checklist_id:
            resolvedChecklistId,

          sectionId:
            resolvedSectionId,

          section_id:
            resolvedSectionId,
        },

        property:
          selectedProperty,

        propertyId:
          selectedPropertyId,

        date:
          selectedDate,

        sectionId:
          resolvedSectionId,

        sectionTitle:
          resolvedSectionTitle,

        sectionDescription:
          getSectionDescription(
            section,
          ),

        section:
          section || null,

        // VERY IMPORTANT
        readOnly:
          readOnly,

        mode:
          readOnly
            ? 'view'
            : 'edit',
      },
    );
  };

  // ======================================
  // PROPERTY CHANGE
  // ======================================

  const handlePropertyChange =
    property => {
      console.log(
        'DROPDOWN PROPERTY:',
        property,
      );

      let propertyName = '';
      let propertyObject = null;

      // STRING
      if (
        typeof property ===
        'string'
      ) {
        propertyName =
          property;

        propertyObject =
          properties.find(
            item =>
              getPropertyName(
                item,
              ) ===
              property,
          );
      }

      // OBJECT
      else if (
        property &&
        typeof property ===
          'object'
      ) {
        propertyObject =
          property;

        propertyName =
          getPropertyName(
            property,
          );
      }

      // FIND BY UNIT ID
      if (
        !propertyObject &&
        property?.unit_id
      ) {
        propertyObject =
          properties.find(
            item =>
              String(
                item?.unit_id,
              ) ===
              String(
                property?.unit_id,
              ),
          );
      }

      // FIND BY ID
      if (
        !propertyObject &&
        property?.id
      ) {
        propertyObject =
          properties.find(
            item =>
              String(
                item?.unit_id ??
                  item?.id,
              ) ===
              String(
                property?.id,
              ),
          );
      }

      const finalPropertyName =
        propertyObject
          ? getPropertyName(
              propertyObject,
            )
          : propertyName;

      const finalPropertyId =
        propertyObject?.unit_id ??
        propertyObject?.id ??
        null;

      setSelectedProperty(
        finalPropertyName,
      );

      setSelectedPropertyId(
        finalPropertyId,
      );

      // IMPORTANT:
      // property change ke time old
      // checklist immediately clear karo
      setSavedRooms([]);

      if (
        finalPropertyId !==
          undefined &&
        finalPropertyId !== null
      ) {
        AsyncStorage.setItem(
          SELECTED_PROPERTY_KEY,
          String(
            finalPropertyId,
          ),
        ).catch(error =>
          console.log(
            'SAVE PROPERTY ERROR:',
            error,
          ),
        );
      }

      console.log(
        'FINAL SELECTED PROPERTY:',
        finalPropertyName,
      );

      console.log(
        'FINAL SELECTED PROPERTY ID:',
        finalPropertyId,
      );

      console.log(
        'FINAL SELECTED HOME SECTIONS:',
        propertyObject?.home_sections,
      );
    };

  // ======================================
  // DATE SELECT
  // ======================================

  const handleSelectDate =
    date => {
      if (!date) {
        return;
      }

      if (!selectedProperty) {
        Alert.alert(
          'Select property',
          'Please select a property first.',
        );

        return;
      }

      const dateKey =
        getDateKey(date);

      // Future disabled
      if (
        dateKey > todayKey
      ) {
        return;
      }

      setSelectedDate(
        dateKey,
      );

      setCalendarVisible(
        false,
      );
    };

  // ======================================
  // DISPLAY DATE
  // ======================================

  const displayDate =
    selectedDate
      ? new Date(
          `${selectedDate}T12:00:00`,
        ).toLocaleDateString(
          'en-US',
          {
            month:
              'short',

            day:
              'numeric',

            year:
              'numeric',
          },
        )
      : 'Select date';

  // ======================================
  // OPEN MEDIA
  // ======================================

  const openRoomMedia =
    room => {
      const mediaItems =
        getRoomMedia(room);

      if (
        mediaItems.length ===
        0
      ) {
        return;
      }

      const video =
        mediaItems.find(
          item =>
            item?.type ===
            'video',
        );

      setVideoAspectRatio(
        video?.width &&
          video?.height
          ? video.width /
              video.height
          : 16 / 9,
      );

      setActiveMediaItem(
        video ||
          mediaItems[0] ||
          null,
      );

      setActiveMedia(room);
    };

  // ======================================
  // PROPERTY OPTIONS
  // ======================================

  const propertyOptions =
    properties
      .map(item =>
        getPropertyName(
          item,
        ),
      )
      .filter(Boolean);

  // ======================================
  // RENDER
  // ======================================

  return (
    <View
      style={
        styles.container
      }>

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
        keyboardShouldPersistTaps="handled">

        {/* ================================= */}
        {/* PROPERTY */}
        {/* ================================= */}

        <View
          style={
            styles.propertyDropdownWrap
          }>

          {propertyLoading ? (
            <View
              style={
                styles.propertyLoader
              }>

              <ActivityIndicator
                size="small"
                color={
                  PRIMARY
                }
              />

              <Text
                style={
                  styles.propertyLoadingText
                }>
                Loading properties...
              </Text>

            </View>
          ) : (
            <PropertyDropdown
              selectedValue={
                selectedProperty
              }
              selectedLabel={
                selectedProperty ||
                undefined
              }
              fallbackProperties={
                propertyOptions
              }
              onChange={
                handlePropertyChange
              }
            />
          )}

        </View>

        {/* ================================= */}
        {/* DATE */}
        {/* ================================= */}

        <Text
          style={
            styles.dateLabel
          }>
          DATE
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={
            styles.dateInput
          }
          onPress={() =>
            setCalendarVisible(
              true,
            )
          }>

          <Text
            style={
              styles.dateInputText
            }>
            {displayDate}
          </Text>

          <CalendarIcon />

        </TouchableOpacity>

        {/* ================================= */}
        {/* SECTIONS */}
        {/* ================================= */}

        {showSections && (
          <>
            <View
              style={
                styles.roomsHeader
              }>
              <Text
                style={
                  styles.sectionLabel
                }>
                SECTIONS
              </Text>
            </View>

            {/* ================================= */}
            {/* PREVIOUS DATE API LOADING */}
            {/* ================================= */}

            {isPastDate &&
              apiLoading && (
                <View
                  style={
                    styles.refreshLoader
                  }>

                  <ActivityIndicator
                    size="small"
                    color="#176B50"
                  />

                  <Text
                    style={
                      styles.refreshLoaderText
                    }>
                    Loading previous checklist...
                  </Text>

                </View>
              )}

            {/* ================================= */}
            {/* TODAY LOCAL LOADING */}
            {/* ================================= */}

            {isToday &&
              roomsLoading && (
                <View
                  style={
                    styles.refreshLoader
                  }>

                  <ActivityIndicator
                    size="small"
                    color="#176B50"
                  />

                  <Text
                    style={
                      styles.refreshLoaderText
                    }>
                    Refreshing checklist...
                  </Text>

                </View>
              )}

            {/* ================================= */}
            {/* NO SECTIONS */}
            {/* ================================= */}

            {!apiLoading &&
              !roomsLoading &&
              sections.length === 0 && (
                <View
                  style={
                    styles.emptySectionCard
                  }>

                  <Text
                    style={
                      styles.emptySectionTitle
                    }>
                    No sections found
                  </Text>

                  <Text
                    style={
                      styles.emptySectionText
                    }>
                    No cleaning sections are available for this property.
                  </Text>

                </View>
              )}

            {/* ================================= */}
            {/* DYNAMIC SECTIONS */}
            {/* ================================= */}

            {!apiLoading &&
              !roomsLoading &&
              sections.map(
                section => {
                  const room =
                    getRoomForSection(
                      section,
                    );

                  const sectionTitle =
                    getSectionName(
                      section,
                    );

                  const sectionDescription =
                    getSectionDescription(
                      section,
                    );

                  return (
                    <View
                      key={String(
                        section?.id ??
                          sectionTitle,
                      )}
                      style={
                        styles.roomCard
                      }>

                      {/* HEADER */}

                      <View
                        style={
                          styles.roomHeaderRow
                        }>

                        <View
                          style={
                            styles.roomHeadingWrap
                          }>

                          <Text
                            style={
                              styles.roomTitle
                            }>
                            {
                              sectionTitle
                            }
                          </Text>

                        </View>

                        {/* ADD ONLY TODAY */}

                        {!room &&
                          isToday && (
                            <TouchableOpacity
                              activeOpacity={
                                0.8
                              }
                              style={
                                styles.addRoomButton
                              }
                              onPress={() =>
                                openAddRoom(
                                  section,
                                )
                              }>

                              <Text
                                style={
                                  styles.addRoomText
                                }>
                                + Add
                              </Text>

                            </TouchableOpacity>
                          )}

                      </View>

                      {/* SECTION DESCRIPTION */}

                      {!room &&
                        sectionDescription ? (
                        <Text
                          style={
                            styles.sectionDescription
                          }>
                          {
                            sectionDescription
                          }
                        </Text>
                      ) : null}

                      {/* ================================= */}
                      {/* PREVIOUS DATE NO DATA */}
                      {/* ================================= */}

                      {isPastDate &&
                        !room && (
                          <View
                            style={
                              styles.noRecordWrap
                            }>

                            <Text
                              style={
                                styles.noRecordText
                              }>
                              No checklist recorded for this date.
                            </Text>

                          </View>
                        )}

                      {/* ================================= */}
                      {/* SAVED ROOM */}
                      {/* ================================= */}

                      {room && (
                        <>
                          <Text
                            style={
                              styles.roomComment
                            }>
                            {
                              room?.description ||
                              room?.comment ||
                              sectionDescription
                            }
                          </Text>

                          {/* MEDIA */}

                          {getRoomMedia(
                            room,
                          ).length >
                            0 && (
                            <TouchableOpacity
                              activeOpacity={
                                0.85
                              }
                              style={
                                styles.mediaPreview
                              }
                              onPress={() =>
                                openRoomMedia(
                                  room,
                                )
                              }>

                              <View
                                style={
                                  styles.mediaTint
                                }
                              />

                              <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={
                                  false
                                }
                                contentContainerStyle={
                                  styles.mediaListPreview
                                }>

                                {getRoomMedia(
                                  room,
                                ).map(
                                  (
                                    item,
                                    index,
                                  ) => (
                                    <View
                                      key={`${item?.uri}-${index}`}
                                      style={
                                        styles.mediaItemPreview
                                      }>

                                      {item?.type ===
                                      'photo' ? (
                                        <Image
                                          source={{
                                            uri:
                                              item?.uri,
                                          }}
                                          style={
                                            styles.mediaImage
                                          }
                                        />
                                      ) : (
                                        <View
                                          style={
                                            styles.videoThumbnail
                                          }>

                                          <Video
                                            source={{
                                              uri:
                                                item?.uri,
                                            }}
                                            style={
                                              styles.videoThumbnailImage
                                            }
                                            resizeMode="cover"
                                            paused
                                            muted
                                          />

                                          <View
                                            style={
                                              styles.videoPreviewIcon
                                            }>

                                            <Text
                                              style={
                                                styles.playIcon
                                              }>
                                              ▶
                                            </Text>

                                          </View>

                                        </View>
                                      )}

                                    </View>
                                  ),
                                )}

                              </ScrollView>

                            </TouchableOpacity>
                          )}

                          {/* DIVIDER */}

                          <View
                            style={
                              styles.roomDivider
                            }
                          />

                          {/* VIEW / EDIT */}

                          <TouchableOpacity
                            activeOpacity={
                              0.8
                            }
                            style={
                              styles.editButton
                            }
                            onPress={() =>
                              openEditRoom(
                                room,
                                section,
                              )
                            }>

                            {isPastDate ? (
                              <EyeIcon
                                size={
                                  16
                                }
                                color="#287954"
                              />
                            ) : (
                              <EditIcon
                                size={
                                  16
                                }
                                color="#287954"
                              />
                            )}

                            <Text
                              style={
                                styles.editText
                              }>
                              {isPastDate
                                ? 'View'
                                : 'Edit'}
                            </Text>

                          </TouchableOpacity>

                        </>
                      )}

                    </View>
                  );
                },
              )}
          </>
        )}
      </ScrollView>

      {/* ==================================== */}
      {/* CALENDAR MODAL */}
      {/* ==================================== */}

      <Modal
        visible={
          calendarVisible
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setCalendarVisible(
            false,
          )
        }>

        <Pressable
          style={
            styles.calendarBackdrop
          }
          onPress={() =>
            setCalendarVisible(
              false,
            )
          }>

          <Pressable
            style={
              styles.calendarModal
            }
            onPress={event =>
              event.stopPropagation()
            }>

            {/* HEADER */}

            <View
              style={
                styles.calendarHeader
              }>

              <TouchableOpacity
                activeOpacity={
                  0.8
                }
                style={
                  styles.dateArrow
                }
                onPress={() =>
                  setCalendarMonth(
                    month =>
                      new Date(
                        month.getFullYear(),
                        month.getMonth() -
                          1,
                        1,
                      ),
                  )
                }>

                <Text
                  style={
                    styles.dateArrowText
                  }>
                  ‹
                </Text>

              </TouchableOpacity>

              <Text
                style={
                  styles.calendarTitle
                }>
                {calendarMonth.toLocaleDateString(
                  'en-US',
                  {
                    month:
                      'long',
                    year:
                      'numeric',
                  },
                )}
              </Text>

              <TouchableOpacity
                activeOpacity={
                  0.8
                }
                style={[
                  styles.dateArrow,
                  calendarMonth.getFullYear() ===
                    new Date().getFullYear() &&
                    calendarMonth.getMonth() >=
                      new Date().getMonth() &&
                    styles.dateArrowDisabled,
                ]}
                disabled={
                  calendarMonth.getFullYear() >
                    new Date().getFullYear() ||
                  (calendarMonth.getFullYear() ===
                    new Date().getFullYear() &&
                    calendarMonth.getMonth() >=
                      new Date().getMonth())
                }
                onPress={() =>
                  setCalendarMonth(
                    month =>
                      new Date(
                        month.getFullYear(),
                        month.getMonth() +
                          1,
                        1,
                      ),
                  )
                }>

                <Text
                  style={
                    styles.dateArrowText
                  }>
                  ›
                </Text>

              </TouchableOpacity>

            </View>

            {/* WEEKDAYS */}

            <View
              style={
                styles.weekdayRow
              }>

              {[
                'Sun',
                'Mon',
                'Tue',
                'Wed',
                'Thu',
                'Fri',
                'Sat',
              ].map(day => (
                <Text
                  key={day}
                  style={
                    styles.weekdayText
                  }>
                  {day}
                </Text>
              ))}

            </View>

            {/* CALENDAR */}

            <View
              style={
                styles.calendarGrid
              }>

              {calendarDates.map(
                (
                  date,
                  index,
                ) => {
                  if (!date) {
                    return (
                      <View
                        key={`empty-${index}`}
                        style={
                          styles.dayCellEmpty
                        }
                      />
                    );
                  }

                  const dateKey =
                    getDateKey(
                      date,
                    );

                  const isSelected =
                    dateKey ===
                    selectedDate;

                  const isFuture =
                    dateKey >
                    todayKey;

                  return (
                    <TouchableOpacity
                      key={
                        dateKey
                      }
                      activeOpacity={
                        0.8
                      }
                      disabled={
                        isFuture
                      }
                      onPress={() =>
                        handleSelectDate(
                          date,
                        )
                      }
                      style={[
                        styles.dayCell,

                        isSelected &&
                          styles.dayCellSelected,

                        isFuture &&
                          styles.dayCellDisabled,
                      ]}>

                      <Text
                        style={[
                          styles.dayText,

                          isSelected &&
                            styles.dayTextSelected,

                          isFuture &&
                            styles.dayTextDisabled,
                        ]}>
                        {
                          date.getDate()
                        }
                      </Text>

                    </TouchableOpacity>
                  );
                },
              )}

            </View>

            {/* DONE */}

            <TouchableOpacity
              activeOpacity={
                0.9
              }
              style={
                styles.doneButton
              }
              onPress={() =>
                setCalendarVisible(
                  false,
                )
              }>

              <Text
                style={
                  styles.doneButtonText
                }>
                Done
              </Text>

            </TouchableOpacity>

          </Pressable>

        </Pressable>

      </Modal>

      {/* ==================================== */}
      {/* MEDIA MODAL */}
      {/* ==================================== */}

      <Modal
        visible={Boolean(
          activeMedia,
        )}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setActiveMedia(
            null,
          );

          setActiveMediaItem(
            null,
          );
        }}>

        <Pressable
          style={
            styles.modalBackdrop
          }
          onPress={() => {
            setActiveMedia(
              null,
            );

            setActiveMediaItem(
              null,
            );
          }}>

          <Pressable
            style={
              styles.mediaModal
            }
            onPress={event =>
              event.stopPropagation()
            }>

            {/* HEADER */}

            <View
              style={
                styles.modalHeader
              }>

              <Text
                style={
                  styles.modalTitle
                }
                numberOfLines={
                  1
                }>
                {activeMedia?.title ||
                  activeMedia?.sectionTitle ||
                  activeMedia?.section_name ||
                  'Media'}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  setActiveMedia(
                    null,
                  );

                  setActiveMediaItem(
                    null,
                  );
                }}>

                <Text
                  style={
                    styles.closeText
                  }>
                  ×
                </Text>

              </TouchableOpacity>

            </View>

            {/* VIDEO */}

            {activeMediaItem?.type ===
            'video' ? (
              <Video
                source={{
                  uri:
                    activeMediaItem?.uri,
                }}
                style={[
                  styles.video,
                  {
                    aspectRatio:
                      videoAspectRatio,
                  },
                ]}
                resizeMode="contain"
                controls
                paused={
                  !activeMedia
                }
                onLoad={event => {
                  const naturalSize =
                    event?.naturalSize;

                  if (
                    naturalSize?.width &&
                    naturalSize?.height
                  ) {
                    setVideoAspectRatio(
                      naturalSize.width /
                        naturalSize.height,
                    );
                  }
                }}
              />
            ) : (
              <Image
                source={{
                  uri:
                    activeMediaItem?.uri,
                }}
                style={
                  styles.video
                }
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

// ========================================
// STYLES
// ========================================

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        BACKGROUND,
    },

    content: {
      padding: 16,
      paddingBottom: 32,
    },

    propertyDropdownWrap: {
      marginBottom: 24,
    },

    propertyLoader: {
      height: 54,
      borderWidth: 1,
      borderColor:
        '#D9E5DE',
      borderRadius: 13,
      backgroundColor:
        '#FFFFFF',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 8,
    },

    propertyLoadingText: {
      fontSize: 13,
      color: '#82958C',
      fontWeight: '600',
    },

    sectionLabel: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.5,
      color: '#849890',
    },

    dateLabel: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.5,
      color: '#849890',
      marginBottom: 8,
    },

    dateInput: {
      height: 54,
      borderWidth: 1,
      borderColor:
        '#D9E5DE',
      borderRadius: 13,
      backgroundColor:
        '#FFFFFF',
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      marginBottom: 24,
    },

    dateInputText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#173A30',
    },

    roomsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },

    emptySectionCard: {
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#DCE8E1',
      borderRadius: 17,
      padding: 18,
      marginTop: 12,
    },

    emptySectionTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: '#173A30',
      marginBottom: 5,
    },

    emptySectionText: {
      fontSize: 13,
      lineHeight: 19,
      color: '#70837B',
    },

    sectionDescription: {
      fontSize: 13,
      lineHeight: 19,
      color: '#536B60',
      marginTop: 7,
      paddingRight: 10,
    },

    roomHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
    },

    roomHeadingWrap: {
      flex: 1,
      paddingRight: 10,
    },

    addRoomButton: {
      borderWidth: 1,
      borderColor:
        '#CFE6D9',
      backgroundColor:
        '#F8FCF9',
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },

    addRoomText: {
      fontSize: 12,
      color: '#287954',
      fontWeight: '700',
    },

    roomCard: {
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#DCE8E1',
      borderRadius: 17,
      padding: 16,
      marginTop: 12,
    },

    roomTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: '#173A30',
    },

    roomComment: {
      fontSize: 13,
      lineHeight: 19,
      color: '#536B60',
      marginTop: 5,
    },

    noRecordWrap: {
      marginTop: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor:
        '#F8FAF9',
      borderRadius: 10,
    },

    noRecordText: {
      fontSize: 12,
      lineHeight: 18,
      color: '#84958E',
      fontWeight: '600',
    },

    mediaPreview: {
      width: '100%',
      height: 72,
      borderRadius: 11,
      overflow: 'hidden',
      backgroundColor:
        '#DCECE4',
      marginTop: 14,
      justifyContent:
        'center',
    },

    mediaListPreview: {
      paddingHorizontal: 6,
      alignItems: 'center',
    },

    mediaItemPreview: {
      width: 60,
      height: 60,
      borderRadius: 9,
      overflow: 'hidden',
      backgroundColor:
        '#AFCFC0',
      marginHorizontal: 4,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    videoThumbnail: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    videoThumbnailImage: {
      position: 'absolute',
      width: '100%',
      height: '100%',
    },

    mediaTint: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      backgroundColor:
        '#AFCFC0',
    },

    mediaImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },

    videoPreviewIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor:
        '#FFFFFF',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    playIcon: {
      fontSize: 9,
      color: PRIMARY,
      marginLeft: 2,
    },

    roomDivider: {
      height: 1,
      backgroundColor:
        '#E5EEE9',
      marginTop: 12,
    },

    editButton: {
      alignSelf: 'flex-end',
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor:
        '#D0E5D8',
      backgroundColor:
        '#F8FCF9',
      borderRadius: 17,
      paddingHorizontal: 13,
      paddingVertical: 8,
      marginTop: 12,
    },

    editText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#287954',
      marginLeft: 6,
    },

    calendarBackdrop: {
      flex: 1,
      backgroundColor:
        'rgba(17, 24, 39, 0.32)',
      justifyContent:
        'center',
      alignItems: 'center',
      paddingHorizontal: 18,
    },

    calendarModal: {
      width: '100%',
      maxWidth: 420,
      backgroundColor:
        '#FFFFFF',
      borderRadius: 20,
      padding: 18,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity: 0.15,
      shadowRadius: 15,
    },

    calendarHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      marginBottom: 14,
    },

    calendarTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: '#1F2D2A',
    },

    weekdayRow: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      marginBottom: 10,
    },

    weekdayText: {
      flex: 1,
      textAlign: 'center',
      fontSize: 11,
      color: '#6E8B84',
      fontWeight: '700',
    },

    calendarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },

    dateArrow: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor:
        '#EAF7F3',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    dateArrowDisabled: {
      opacity: 0.35,
    },

    dateArrowText: {
      fontSize: 22,
      color: '#113B32',
      fontWeight: '700',
    },

    dayCell: {
      width: '14.285%',
      height: 40,
      justifyContent:
        'center',
      alignItems: 'center',
      marginBottom: 8,
      borderRadius: 10,
    },

    dayCellSelected: {
      backgroundColor:
        '#17B978',
    },

    dayCellDisabled: {
      opacity: 0.35,
    },

    dayCellEmpty: {
      width: '14.285%',
      height: 40,
    },

    dayText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#1F2D2A',
    },

    dayTextSelected: {
      color: '#FFFFFF',
    },

    dayTextDisabled: {
      color: '#A0AAA7',
    },

    doneButton: {
      marginTop: 14,
      backgroundColor:
        '#EAF7F3',
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },

    doneButtonText: {
      fontSize: 15,
      fontWeight: '800',
      color: '#114433',
    },

    modalBackdrop: {
      flex: 1,
      backgroundColor:
        'rgba(12, 30, 24, 0.72)',
      justifyContent:
        'center',
      padding: 18,
    },

    mediaModal: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 18,
      overflow: 'hidden',
    },

    modalHeader: {
      minHeight: 55,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
    },

    modalTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: '800',
      color: '#173A30',
      marginRight: 12,
    },

    closeText: {
      fontSize: 28,
      color: '#536B60',
    },

    video: {
      width: '100%',
      aspectRatio: 16 / 9,
      backgroundColor:
        '#152A22',
    },

    refreshLoader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      paddingVertical: 12,
      marginBottom: 4,
    },

    refreshLoaderText: {
      marginLeft: 8,
      fontSize: 12,
      fontWeight: '600',
      color: '#6E8179',
    },
  });