import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import PageHeader from '../components/PageHeader';

const PRIMARY = '#17B978';
const DARK = '#222222';
const BACKGROUND = '#F3F4F8';

const API_URL =
  'https://staysereno.in/api/staff/services/maintenance';

const STORAGE_URL =
  'https://staysereno.in/storage/';

/* =====================================================
   HELPERS
===================================================== */

const toBoolean = value => {
  if (
    value === true ||
    value === 1 ||
    value === '1'
  ) {
    return true;
  }

  if (
    typeof value === 'string' &&
    value.toLowerCase() === 'true'
  ) {
    return true;
  }

  return false;
};

/* =====================================================
   NORMALIZE BOOKING ID
===================================================== */

const normalizeBookingId = value => {
  if (
    value === null ||
    value === undefined
  ) {
    return '';
  }

  let id = String(value).trim();

  if (!id) {
    return '';
  }

  /*
    Example:

    blocked-0-15-2026-09-20-2026-09-27

    becomes:

    0-15
  */

  if (id.startsWith('blocked-')) {
    const withoutBlocked =
      id.replace(/^blocked-/, '');

    const parts =
      withoutBlocked.split('-');

    const dateIndex =
      parts.findIndex(part =>
        /^\d{4}$/.test(part),
      );

    if (dateIndex > 0) {
      id = parts
        .slice(0, dateIndex)
        .join('-');
    } else {
      id = withoutBlocked;
    }
  }

  return id.toLowerCase();
};

/* =====================================================
   ITEM BOOKING IDS
===================================================== */

const getItemBookingIds = item => {
  const ids = [
    item?.booking_id,
    item?.bookingId,

    item?.booking?.id,
    item?.booking?.booking_id,
    item?.booking?.bookingId,

    item?.blocked_booking_id,
    item?.blockedBookingId,

    item?.block_id,
    item?.blockId,

    item?.reservation_id,
    item?.reservationId,

    item?.blocked_booking?.id,
    item?.blocked_booking?.booking_id,
    item?.blocked_booking?.bookingId,

    item?.blockedBooking?.id,
    item?.blockedBooking?.booking_id,
    item?.blockedBooking?.bookingId,
  ];

  return ids
    .filter(
      value =>
        value !== null &&
        value !== undefined &&
        String(value).trim() !== '',
    )
    .map(normalizeBookingId)
    .filter(Boolean);
};

/* =====================================================
   CURRENT BOOKING IDS
===================================================== */

const getCurrentBookingIds = booking => {
  const rawIds = [
    booking?.bookingId,
    booking?.booking_id,
    booking?.id,

    booking?.blocked_booking_id,
    booking?.blockedBookingId,

    booking?.block_id,
    booking?.blockId,

    booking?.reservation_id,
    booking?.reservationId,
  ];

  const result = new Set();

  rawIds.forEach(value => {
    const normalized =
      normalizeBookingId(value);

    if (normalized) {
      result.add(normalized);
    }
  });

  return Array.from(result);
};

/* =====================================================
   UNIT ID
===================================================== */

const getItemUnitId = item => {
  return (
    item?.unit_id ??
    item?.unitId ??
    item?.booking?.unit_id ??
    item?.booking?.unitId ??
    item?.property?.unit_id ??
    item?.property?.unitId ??
    item?.blocked_booking?.unit_id ??
    item?.blocked_booking?.unitId ??
    item?.blockedBooking?.unit_id ??
    item?.blockedBooking?.unitId ??
    ''
  );
};

/* =====================================================
   START DATE
===================================================== */

const getItemStartDate = item => {
  return (
    item?.date_from ||
    item?.startDate ||
    item?.start_date ||
    item?.date ||
    item?.booking?.date_from ||
    item?.booking?.startDate ||
    item?.blocked_booking?.date_from ||
    item?.blocked_booking?.startDate ||
    item?.blockedBooking?.date_from ||
    item?.blockedBooking?.startDate ||
    ''
  );
};

/* =====================================================
   END DATE
===================================================== */

const getItemEndDate = item => {
  return (
    item?.date_to ||
    item?.endDate ||
    item?.end_date ||
    item?.booking?.date_to ||
    item?.booking?.endDate ||
    item?.blocked_booking?.date_to ||
    item?.blocked_booking?.endDate ||
    item?.blockedBooking?.date_to ||
    item?.blockedBooking?.endDate ||
    ''
  );
};

/* =====================================================
   BLOCKED ITEM
===================================================== */

const isBlockedItem = item => {
  if (
    toBoolean(item?.is_blocked) ||
    toBoolean(item?.isBlocked) ||
    toBoolean(item?.blocked)
  ) {
    return true;
  }

  if (
    String(
      item?.status || '',
    ).toLowerCase() ===
      'blocked' ||
    String(
      item?.booking_status || '',
    ).toLowerCase() ===
      'blocked'
  ) {
    return true;
  }

  return false;
};

/* =====================================================
   SERVICES
===================================================== */

const getServicesFromItem = item => {
  if (Array.isArray(item?.service)) {
    return item.service;
  }

  if (Array.isArray(item?.services)) {
    return item.services;
  }

  return [];
};

/* =====================================================
   SERVICE NAME
===================================================== */

const getServiceName = service => {
  return (
    service?.staff_service?.service_name ||
    service?.staffService?.service_name ||
    service?.service_name ||
    service?.serviceName ||
    service?.name ||
    ''
  );
};

/* =====================================================
   SERVICE TYPE
===================================================== */

const getServiceType = service => {
  return (
    service?.service_type ??
    service?.serviceType ??
    service?.staff_service?.id ??
    service?.staffService?.id ??
    ''
  );
};

/* =====================================================
   COMPONENT
===================================================== */

const BookingDetail = ({
  navigation,
  route,
}) => {
  const booking =
    route?.params?.booking || {};

  const property =
    route?.params?.property || {};

  const [
    workProgressList,
    setWorkProgressList,
  ] = useState([]);

  const [
    workProgressLoading,
    setWorkProgressLoading,
  ] = useState(false);

  /* ===================================================
     CURRENT BOOKING ID
  =================================================== */

  const getCurrentBookingId = () => {
    return (
      booking?.bookingId ??
      booking?.booking_id ??
      booking?.id
    );
  };

  /* ===================================================
     MEDIA URL
  =================================================== */

  const getMediaUrl = file => {
    if (!file) {
      return '';
    }

    let value = '';

    if (typeof file === 'string') {
      value = file;
    } else {
      value =
        file?.url ||
        file?.file_url ||
        file?.file_path ||
        file?.path ||
        file?.media_url ||
        file?.mediaUrl ||
        file?.src ||
        file?.file_name ||
        file?.filename ||
        '';
    }

    if (!value) {
      return '';
    }

    value = String(value).trim();

    if (!value) {
      return '';
    }

    if (
      value.startsWith('http://') ||
      value.startsWith('https://')
    ) {
      return value;
    }

    let cleanPath =
      value.replace(/^\/+/, '');

    if (
      cleanPath.startsWith(
        'storage/',
      )
    ) {
      return `https://staysereno.in/${cleanPath}`;
    }

    if (
      cleanPath.startsWith(
        'public/storage/',
      )
    ) {
      cleanPath =
        cleanPath.replace(
          'public/storage/',
          'storage/',
        );

      return `https://staysereno.in/${cleanPath}`;
    }

    return `${STORAGE_URL}${cleanPath}`;
  };

  /* ===================================================
     VIDEO FILE
  =================================================== */

  const isVideoFile = file => {
    let type = '';
    let fileName = '';

    if (
      typeof file === 'string'
    ) {
      fileName = file;
    } else {
      type = String(
        file?.type ||
          file?.mime_type ||
          file?.mime ||
          '',
      ).toLowerCase();

      fileName = String(
        file?.file_name ||
          file?.filename ||
          file?.url ||
          file?.file_url ||
          '',
      ).toLowerCase();
    }

    if (
      type.includes('video')
    ) {
      return true;
    }

    return (
      fileName.endsWith('.mp4') ||
      fileName.endsWith('.mov') ||
      fileName.endsWith('.avi') ||
      fileName.endsWith('.mkv') ||
      fileName.endsWith('.webm') ||
      fileName.endsWith('.m4v')
    );
  };

  /* ===================================================
     PARSE MEDIA
  =================================================== */

  const parseMediaValue = value => {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value;
    }

    if (
      typeof value === 'string'
    ) {
      const trimmed =
        value.trim();

      if (!trimmed) {
        return [];
      }

      try {
        const parsed =
          JSON.parse(trimmed);

        if (
          Array.isArray(parsed)
        ) {
          return parsed;
        }

        if (
          parsed &&
          typeof parsed ===
            'object'
        ) {
          return [parsed];
        }
      } catch (error) {
        return [
          {
            file_name:
              trimmed,
          },
        ];
      }

      return [];
    }

    if (
      typeof value ===
      'object'
    ) {
      const result = [];

      if (
        Array.isArray(
          value.photo,
        )
      ) {
        result.push(
          ...value.photo.map(
            item => ({
              ...item,
              type:
                item?.type ||
                'photo',
            }),
          ),
        );
      }

      if (
        Array.isArray(
          value.photos,
        )
      ) {
        result.push(
          ...value.photos.map(
            item => ({
              ...item,
              type:
                item?.type ||
                'photo',
            }),
          ),
        );
      }

      if (
        Array.isArray(
          value.video,
        )
      ) {
        result.push(
          ...value.video.map(
            item => ({
              ...item,
              type:
                item?.type ||
                'video',
            }),
          ),
        );
      }

      if (
        Array.isArray(
          value.videos,
        )
      ) {
        result.push(
          ...value.videos.map(
            item => ({
              ...item,
              type:
                item?.type ||
                'video',
            }),
          ),
        );
      }

      if (
        result.length > 0
      ) {
        return result;
      }

      if (
        value.file_name ||
        value.filename ||
        value.url ||
        value.file_url ||
        value.file_path ||
        value.path
      ) {
        return [value];
      }
    }

    return [];
  };

  /* ===================================================
     EXTRACT MEDIA
  =================================================== */

  const extractMedia = item => {
    const possibleMediaValues = [
      item?.media,
      item?.medias,
      item?.files,
      item?.attachments,
      item?.media_files,
      item?.mediaFiles,
    ];

    for (
      const value of possibleMediaValues
    ) {
      const parsed =
        parseMediaValue(
          value,
        );

      if (
        parsed.length > 0
      ) {
        return parsed;
      }
    }

    const result = [];

    [
      item?.photo,
      item?.photos,
    ].forEach(value => {
      const parsed =
        parseMediaValue(
          value,
        );

      parsed.forEach(
        file => {
          result.push({
            ...file,
            type:
              file?.type ||
              'photo',
          });
        },
      );
    });

    [
      item?.video,
      item?.videos,
    ].forEach(value => {
      const parsed =
        parseMediaValue(
          value,
        );

      parsed.forEach(
        file => {
          result.push({
            ...file,
            type:
              file?.type ||
              'video',
          });
        },
      );
    });

    return result;
  };

  /* ===================================================
     NORMALIZE MEDIA
  =================================================== */

  const normalizeMedia = item => {
    const rawMedia =
      extractMedia(item);

    return rawMedia
      .map(
        (file, index) => {
          const uri =
            getMediaUrl(file);

          const video =
            isVideoFile(file);

          return {
            id:
              file?.id ??
              `${item?.id}-${index}`,

            type: video
              ? 'video'
              : 'photo',

            uri,

            file_name:
              file?.file_name ||
              file?.filename ||
              file?.name ||
              '',
          };
        },
      )
      .filter(
        file => file.uri,
      );
  };

  /* ===================================================
     FETCH WORK PROGRESS
  =================================================== */

  const fetchWorkProgress =
    useCallback(async () => {
      try {
        setWorkProgressLoading(
          true,
        );

        /* ===============================================
           TOKEN
        =============================================== */

        const token =
          (await AsyncStorage.getItem(
            'authToken',
          )) ||
          (await AsyncStorage.getItem(
            'token',
          )) ||
          (await AsyncStorage.getItem(
            'access_token',
          )) ||
          (await AsyncStorage.getItem(
            'userToken',
          ));

        /* ===============================================
           BOOKING INFO
        =============================================== */

        const currentBookingId =
          getCurrentBookingId();

        const currentBookingIds =
          getCurrentBookingIds(
            booking,
          );

        const currentUnitId =
          booking?.unit_id ??
          booking?.unitId ??
          property?.unit_id ??
          property?.id ??
          '';

        const currentStartDate =
          booking?.startDate ||
          booking?.date_from ||
          booking?.start_date ||
          booking?.date ||
          '';

        const currentEndDate =
          booking?.endDate ||
          booking?.date_to ||
          booking?.end_date ||
          '';

        const currentIsBlocked =
          toBoolean(
            booking?.isBlocked,
          ) ||
          toBoolean(
            booking?.is_blocked,
          ) ||
          String(
            currentBookingId || '',
          ).startsWith(
            'blocked-',
          );

        console.log(
          '====================================',
        );

        console.log(
          'BOOKING DETAIL',
        );

        console.log(
          'CURRENT BOOKING:',
          JSON.stringify(
            booking,
            null,
            2,
          ),
        );

        console.log(
          'CURRENT BOOKING ID:',
          currentBookingId,
        );

        console.log(
          'CURRENT BOOKING IDS:',
          currentBookingIds,
        );

        console.log(
          'CURRENT UNIT:',
          currentUnitId,
        );

        console.log(
          'CURRENT START DATE:',
          currentStartDate,
        );

        console.log(
          'CURRENT END DATE:',
          currentEndDate,
        );

        console.log(
          'CURRENT BLOCKED:',
          currentIsBlocked,
        );

        console.log(
          '====================================',
        );

        /* ===============================================
           API
        =============================================== */

        const response =
          await fetch(
            API_URL,
            {
              method: 'GET',

              headers: {
                Accept:
                  'application/json',

                'Content-Type':
                  'application/json',

                ...(token
                  ? {
                      Authorization:
                        `Bearer ${token}`,
                    }
                  : {}),
              },
            },
          );

        const responseText =
          await response.text();

        console.log(
          'WORK PROGRESS STATUS:',
          response.status,
        );

        console.log(
          'WORK PROGRESS RESPONSE:',
          responseText,
        );

        /* ===============================================
           PARSE
        =============================================== */

        let result;

        try {
          result =
            JSON.parse(
              responseText,
            );
        } catch (error) {
          throw new Error(
            'Invalid server response.',
          );
        }

        /* ===============================================
           401
        =============================================== */

        if (
          response.status === 401
        ) {
          setWorkProgressList(
            [],
          );

          return;
        }

        /* ===============================================
           ERROR
        =============================================== */

        if (!response.ok) {
          throw new Error(
            result?.message ||
              `Request failed with status ${response.status}`,
          );
        }

        /* ===============================================
           API LIST
        =============================================== */

        let apiList = [];

        if (
          Array.isArray(result)
        ) {
          apiList = result;
        } else if (
          Array.isArray(
            result?.data,
          )
        ) {
          apiList =
            result.data;
        } else if (
          Array.isArray(
            result?.data?.data,
          )
        ) {
          apiList =
            result.data.data;
        } else if (
          Array.isArray(
            result?.result,
          )
        ) {
          apiList =
            result.result;
        } else if (
          Array.isArray(
            result?.result?.data,
          )
        ) {
          apiList =
            result.result.data;
        }

        console.log(
          'TOTAL API ITEMS:',
          apiList.length,
        );

        /* ===============================================
           FILTER
        =============================================== */

        const filteredList =
          apiList.filter(item => {
            const itemBookingIds =
              getItemBookingIds(
                item,
              );

            const itemUnitId =
              getItemUnitId(item);

            const itemStartDate =
              getItemStartDate(
                item,
              );

            const itemEndDate =
              getItemEndDate(
                item,
              );

            const itemBlocked =
              isBlockedItem(item);

            const normalizedItemUnitId =
              String(
                itemUnitId ?? '',
              ).trim();

            const normalizedCurrentUnitId =
              String(
                currentUnitId ?? '',
              ).trim();

            const bookingIdMatch =
              currentBookingIds.some(
                currentId =>
                  itemBookingIds.includes(
                    currentId,
                  ),
              );

            const unitMatch =
              normalizedCurrentUnitId &&
              normalizedItemUnitId
                ? normalizedCurrentUnitId ===
                  normalizedItemUnitId
                : true;

            const startDateMatch =
              currentStartDate &&
              itemStartDate
                ? String(
                    currentStartDate,
                  ) ===
                  String(
                    itemStartDate,
                  )
                : false;

            const endDateMatch =
              currentEndDate &&
              itemEndDate
                ? String(
                    currentEndDate,
                  ) ===
                  String(
                    itemEndDate,
                  )
                : false;

            /* =========================================
               BLOCKED
            ========================================= */

            if (
              currentIsBlocked
            ) {
              if (
                bookingIdMatch
              ) {
                return true;
              }

              if (
                itemBlocked &&
                unitMatch &&
                startDateMatch &&
                endDateMatch
              ) {
                return true;
              }

              if (
                unitMatch &&
                startDateMatch &&
                endDateMatch
              ) {
                return true;
              }

              return false;
            }

            /* =========================================
               BOOKED
            ========================================= */

            if (
              bookingIdMatch
            ) {
              return true;
            }

            if (
              unitMatch &&
              startDateMatch &&
              endDateMatch
            ) {
              return true;
            }

            return false;
          });

        console.log(
          'FILTERED WORK PROGRESS:',
          filteredList.length,
        );

        /* ===============================================
           NORMALIZE

           ONE SUBMITTED FORM = ONE ROW

           Multiple services inside the same item
           will be joined together.

           Example:

           Bedsheet change
           +
           Cleaning

           becomes:

           Bedsheet change, Cleaning
        =============================================== */

        const normalizedList =
          [];

        filteredList.forEach(
          item => {
            const services =
              getServicesFromItem(
                item,
              );

            /* =========================================
               SERVICE NAMES
            ========================================= */

            let serviceNames =
              [];

            if (
              services.length > 0
            ) {
              serviceNames =
                services
                  .map(
                    service =>
                      getServiceName(
                        service,
                      ),
                  )
                  .filter(Boolean);
            }

            /* =========================================
               FALLBACK SERVICE
            ========================================= */

            if (
              serviceNames.length ===
              0
            ) {
              const fallbackName =
                item?.staff_service
                  ?.service_name ||
                item?.staffService
                  ?.service_name ||
                item?.service_name ||
                item?.serviceName ||
                'Service';

              serviceNames.push(
                fallbackName,
              );
            }

            /* =========================================
               REMOVE DUPLICATES
            ========================================= */

            serviceNames = [
              ...new Set(
                serviceNames
                  .map(name =>
                    String(
                      name,
                    ).trim(),
                  )
                  .filter(Boolean),
              ),
            ];

            /* =========================================
               SERVICE TYPES
            ========================================= */

            let serviceTypes =
              [];

            if (
              services.length > 0
            ) {
              serviceTypes =
                services
                  .map(
                    service =>
                      getServiceType(
                        service,
                      ),
                  )
                  .filter(
                    value =>
                      value !==
                        null &&
                      value !==
                        undefined &&
                      String(
                        value,
                      ).trim() !==
                        '',
                  );
            }

            if (
              serviceTypes.length ===
              0
            ) {
              const fallbackType =
                item?.service_type ??
                item?.serviceType ??
                '';

              if (
                fallbackType !==
                  null &&
                fallbackType !==
                  undefined &&
                String(
                  fallbackType,
                ).trim() !== ''
              ) {
                serviceTypes.push(
                  fallbackType,
                );
              }
            }

            serviceTypes = [
              ...new Set(
                serviceTypes.map(
                  value =>
                    String(
                      value,
                    ).trim(),
                ),
              ),
            ];

            /* =========================================
               MEDIA
            ========================================= */

            const media =
              normalizeMedia(
                item,
              );

            /* =========================================
               ONE ROW
            ========================================= */

            normalizedList.push({
              id:
                item?.id ??
                `${item?.booking_id}-${item?.created_at || Date.now()}`,

              work_progress_id:
                item?.id,

              booking_id:
                item?.booking_id ??
                item?.bookingId ??
                item?.booking?.id ??
                item?.blocked_booking_id ??
                item?.blockedBookingId,

              service_type:
                serviceTypes,

              service_types:
                serviceTypes,

              /*
                IMPORTANT:

                Multiple services become
                one string.
              */

              service_name:
                serviceNames.join(
                  ', ',
                ),

              /*
                Keep original services
              */

              services,

              comments:
                item?.comments ||
                item?.comment ||
                '',

              created_at:
                item?.created_at ||
                '',

              updated_at:
                item?.updated_at ||
                '',

              date_from:
                item?.date_from ||
                item?.startDate ||
                '',

              date_to:
                item?.date_to ||
                item?.endDate ||
                '',

              unit_id:
                item?.unit_id ??
                item?.unitId ??
                '',

              is_booked:
                item?.is_booked ??
                item?.isBooked ??
                false,

              is_blocked:
                item?.is_blocked ??
                item?.isBlocked ??
                false,

              media,

              original_data:
                item,
            });
          },
        );

        console.log(
          '====================================',
        );

        console.log(
          'FINAL WORK PROGRESS:',
          JSON.stringify(
            normalizedList,
            null,
            2,
          ),
        );

        console.log(
          'TOTAL FORM ROWS:',
          normalizedList.length,
        );

        console.log(
          '====================================',
        );

        setWorkProgressList(
          normalizedList,
        );
      } catch (error) {
        console.log(
          'WORK PROGRESS FETCH ERROR:',
          error,
        );

        setWorkProgressList(
          [],
        );
      } finally {
        setWorkProgressLoading(
          false,
        );
      }
    },
    [
      booking?.bookingId,
      booking?.booking_id,
      booking?.id,

      booking?.blocked_booking_id,
      booking?.blockedBookingId,

      booking?.block_id,
      booking?.blockId,

      booking?.unit_id,
      booking?.unitId,

      booking?.startDate,
      booking?.endDate,

      booking?.date,
      booking?.date_from,
      booking?.date_to,

      booking?.isBlocked,
      booking?.is_blocked,

      property?.unit_id,
      property?.id,
    ],
  );

  /* ===================================================
     AUTO REFRESH
  =================================================== */

  useEffect(() => {
    fetchWorkProgress();

    const refreshInterval =
      setInterval(() => {
        fetchWorkProgress();
      }, 30000);

    return () => {
      clearInterval(
        refreshInterval,
      );
    };
  }, [
    fetchWorkProgress,
  ]);

  /* ===================================================
     SCREEN FOCUS
  =================================================== */

  useEffect(() => {
    const unsubscribe =
      navigation.addListener(
        'focus',
        () => {
          fetchWorkProgress();
        },
      );

    return unsubscribe;
  }, [
    navigation,
    fetchWorkProgress,
  ]);

  /* ===================================================
     PROPERTY
  =================================================== */

  const propertyName =
    property?.final_unit_name ||
    property?.unit_name ||
    property?.unitName ||
    property?.property_name ||
    property?.name ||
    booking?.propertyName ||
    'Unknown Property';

  /* ===================================================
     BOOKING DATES

     API:
     date_from = 2026-09-04
     date_to   = 2026-09-07
  =================================================== */

  const checkInDate =
    booking?.startDate ||
    booking?.date_from ||
    booking?.start_date ||
    booking?.date ||
    booking?.booking?.date_from ||
    booking?.booking?.startDate ||
    '-';

  const checkOutDate =
    booking?.endDate ||
    booking?.date_to ||
    booking?.end_date ||
    booking?.booking?.date_to ||
    booking?.booking?.endDate ||
    '-';

  /* ===================================================
     BOOKING TIME

     API:
     checkin_time  = 14:00
     checkout_time = 11:00
  =================================================== */

  const checkInTime =
    booking?.checkin_time ||
    booking?.checkInTime ||
    booking?.check_in_time ||
    booking?.checkinTime ||
    booking?.booking?.checkin_time ||
    booking?.booking?.checkInTime ||
    booking?.booking?.check_in_time ||
    '';

  const checkOutTime =
    booking?.checkout_time ||
    booking?.checkOutTime ||
    booking?.check_out_time ||
    booking?.checkoutTime ||
    booking?.booking?.checkout_time ||
    booking?.booking?.checkOutTime ||
    booking?.booking?.check_out_time ||
    '';

  /* ===================================================
     STATUS

     IMPORTANT:
     Blocked = no time
  =================================================== */

  const isBlocked =
    toBoolean(
      booking?.isBlocked,
    ) ||
    toBoolean(
      booking?.is_blocked,
    ) ||
    String(
      booking?.bookingId ??
        booking?.booking_id ??
        booking?.id ??
        '',
    ).startsWith(
      'blocked-',
    );

  const isBooked =
    toBoolean(
      booking?.isBooked,
    ) ||
    toBoolean(
      booking?.is_booked,
    );

  /* ===================================================
     FORMAT TIME
  =================================================== */

  const formatTime = time => {
    if (!time) {
      return '';
    }

    const parts =
      String(time).split(':');

    if (
      parts.length < 2
    ) {
      return time;
    }

    let hours =
      parseInt(
        parts[0],
        10,
      );

    const minutes =
      parts[1];

    if (
      isNaN(hours)
    ) {
      return time;
    }

    const period =
      hours >= 12
        ? 'PM'
        : 'AM';

    hours =
      hours % 12 || 12;

    return `${String(
      hours,
    ).padStart(
      2,
      '0',
    )}:${minutes} ${period}`;
  };

  /* ===================================================
     UI
  =================================================== */

  return (
    <View
      style={
        styles.container
      }>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={
          BACKGROUND
        }
      />

      <PageHeader
        navigation={navigation}
        title="Booking Details"
      />

      {/* CONTENT */}

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }>

        {/* PROPERTY */}

        <View
          style={styles.card}>
          <Text
            style={
              styles.sectionTitle
            }>
            Property
          </Text>

          <Text
            style={
              styles.propertyName
            }>
            {propertyName}
          </Text>
        </View>

        {/* BOOKING INFORMATION */}

        <View
          style={styles.card}>
          <Text
            style={
              styles.sectionTitle
            }>
            Booking Information
          </Text>

          <View
            style={styles.divider}
          />

          {/* CHECK IN */}

          <View
            style={
              styles.dateTimeRow
            }>
            <View
              style={
                styles.dateTimeLeft
              }>
              <Text
                style={
                  styles.label
                }>
                Check-in
              </Text>

              {/* <Text
                style={
                  styles.subLabel
                }>
                Arrival
              </Text> */}
            </View>

            <View
              style={
                styles.dateTimeRight
              }>
              <Text
                style={
                  styles.dateValue
                }>
                {checkInDate}
              </Text>

              {/* TIME ONLY FOR BOOKING */}

              {!isBlocked &&
              checkInTime ? (
                <View
                  style={
                    styles.timeBadge
                  }>
                  <Text
                    style={
                      styles.clockIcon
                    }>
                    🕐
                  </Text>

                  <Text
                    style={
                      styles.timeValue
                    }>
                    {formatTime(
                      checkInTime,
                    )}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View
            style={styles.divider}
          />

          {/* CHECK OUT */}

          <View
            style={
              styles.dateTimeRow
            }>
            <View
              style={
                styles.dateTimeLeft
              }>
              <Text
                style={
                  styles.label
                }>
                Check-out
              </Text>

              {/* <Text
                style={
                  styles.subLabel
                }>
                Departure
              </Text> */}
            </View>

            <View
              style={
                styles.dateTimeRight
              }>
              <Text
                style={
                  styles.dateValue
                }>
                {checkOutDate}
              </Text>

              {/* TIME ONLY FOR BOOKING */}

              {!isBlocked &&
              checkOutTime ? (
                <View
                  style={
                    styles.timeBadge
                  }>
                  <Text
                    style={
                      styles.clockIcon
                    }>
                    🕐
                  </Text>

                  <Text
                    style={
                      styles.timeValue
                    }>
                    {formatTime(
                      checkOutTime,
                    )}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View
            style={styles.divider}
          />
        </View>

        {/* STATUS */}

        <View
          style={styles.card}>
          <Text
            style={
              styles.sectionTitle
            }>
            Status
          </Text>

          <View
            style={
              styles.statusRow
            }>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    isBlocked
                      ? DARK
                      : isBooked
                      ? PRIMARY
                      : '#9CA3AF',
                },
              ]}
            />

            <Text
              style={
                styles.statusText
              }>
              {isBlocked
                ? 'Blocked'
                : isBooked
                ? 'Booked'
                : 'Available'}
            </Text>
          </View>
        </View>

         {/* UPDATE WORK PROGRESS */}

        <TouchableOpacity
          activeOpacity={0.85}
          style={
            styles.updateButton
          }
          onPress={() =>
            navigation.navigate(
              'UpdateWorkProgress',
              {
                booking,
                property,
              },
            )
          }>
          <Text
            style={
              styles.updateButtonText
            }>
            Update Work Progress
          </Text>

          <Text
            style={
              styles.updateButtonArrow
            }>
            ›
          </Text>
        </TouchableOpacity>

        {/* WORK PROGRESS */}

        <View
          style={styles.card}>
          <View
            style={
              styles.workProgressHeader
            }>
            <View>
              <Text
                style={
                  styles.sectionTitle
                }>
                Work Progress
              </Text>

              <Text
                style={
                  styles.workProgressSubTitle
                }>
                Submitted services
              </Text>
            </View>

            <View
              style={
                styles.countBadge
              }>
              <Text
                style={
                  styles.countBadgeText
                }>
                {workProgressLoading
                  ? '...'
                  : workProgressList.length}
              </Text>
            </View>
          </View>

          {/* TABLE HEADER */}

          <View
            style={
              styles.progressTableHeader
            }>
            <Text
              style={[
                styles.progressHeaderText,
                styles.serialColumn,
              ]}>
              S.No.
            </Text>

            <Text
              style={[
                styles.progressHeaderText,
                styles.serviceColumn,
              ]}>
              Service Name
            </Text>

            <Text
              style={[
                styles.progressHeaderText,
                styles.viewColumn,
              ]}>
              View
            </Text>
          </View>

          {/* LOADING */}

          {workProgressLoading ? (
            <View
              style={
                styles.emptyProgressContainer
              }>
              <Text
                style={
                  styles.emptyProgressText
                }>
                Loading work progress...
              </Text>
            </View>
          ) : workProgressList.length ===
            0 ? (
            <View
              style={
                styles.emptyProgressContainer
              }>
              <Text
                style={
                  styles.emptyProgressText
                }>
                No work progress submitted yet.
              </Text>
            </View>
          ) : (
            workProgressList.map(
              (item, index) => (
                <TouchableOpacity
                  key={
                    item.id ??
                    index
                  }
                  activeOpacity={0.75}
                  style={[
                    styles.progressListRow,

                    index ===
                    workProgressList.length -
                      1
                      ? styles.lastProgressRow
                      : null,
                  ]}
                  onPress={() =>
                    navigation.navigate(
                      'WorkProgressDetail',
                      {
                        workProgress:
                          item,

                        booking,

                        property,
                      },
                    )
                  }>

                  {/* SERIAL */}

                  <View
                    style={
                      styles.serialColumn
                    }>
                    <View
                      style={
                        styles.serialCircle
                      }>
                      <Text
                        style={
                          styles.serialText
                        }>
                        {index + 1}
                      </Text>
                    </View>
                  </View>

                  {/* SERVICE */}

                  <View
                    style={
                      styles.serviceColumn
                    }>
                    <Text
                      style={
                        styles.serviceName
                      }
                      numberOfLines={2}>
                      {
                        item.service_name
                      }
                    </Text>
                  </View>

                  {/* VIEW */}

                  <View
                    style={
                      styles.viewColumn
                    }>
                    <View
                      style={
                        styles.viewButton
                      }>
                      <Text
                        style={
                          styles.viewButtonText
                        }>
                        View
                      </Text>

                      <Text
                        style={
                          styles.viewArrow
                        }>
                        ›
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ),
            )
          )}
        </View>

       
      </ScrollView>
    </View>
  );
};

export default BookingDetail;

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      BACKGROUND,
  },

  content: {
    padding: 16,
    paddingBottom: 30,
  },

  card: {
    backgroundColor:
      '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    elevation: 3,
    shadowColor:
      '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7A8882',
    marginBottom: 10,
    textTransform:
      'uppercase',
    letterSpacing: 0.8,
  },

  propertyName: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '800',
    color: DARK,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    minHeight: 42,
  },

  label: {
    fontSize: 14,
    color: '#7A8882',
    fontWeight: '500',
  },

  value: {
    flex: 1,
    textAlign: 'right',
    marginLeft: 15,
    fontSize: 14,
    color: DARK,
    fontWeight: '700',
  },

  emptyProgressContainer: {
    minHeight: 80,
    alignItems: 'center',
    justifyContent:
      'center',
    paddingVertical: 20,
  },

  emptyProgressText: {
    fontSize: 13,
    color: '#8A9691',
    fontWeight: '600',
    textAlign: 'center',
  },

  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    minHeight: 62,
  },

  dateTimeLeft: {
    flex: 1,
  },

  subLabel: {
    marginTop: 3,
    fontSize: 11,
    color: '#A0AAA5',
    fontWeight: '500',
  },

  dateTimeRight: {
    alignItems: 'flex-end',
    marginLeft: 15,
  },

  dateValue: {
    fontSize: 14,
    color: DARK,
    fontWeight: '700',
  },

  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor:
      '#F0F8F5',
  },

  clockIcon: {
    fontSize: 11,
    marginRight: 4,
  },

  timeValue: {
    fontSize: 12,
    color: PRIMARY,
    fontWeight: '800',
  },

  divider: {
    height: 1,
    backgroundColor:
      '#EEF2F0',
    marginVertical: 2,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 9,
  },

  statusText: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
  },

  workProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  workProgressSubTitle: {
    fontSize: 11,
    color: '#A0AAA5',
    marginTop: -5,
    marginBottom: 12,
  },

  countBadge: {
    minWidth: 30,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 15,
    backgroundColor:
      '#F0F8F5',
    alignItems: 'center',
    justifyContent:
      'center',
  },

  countBadgeText: {
    fontSize: 12,
    color: PRIMARY,
    fontWeight: '800',
  },

  progressTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 38,
    backgroundColor:
      '#F6F8F7',
    borderRadius: 9,
    paddingHorizontal: 8,
  },

  progressHeaderText: {
    fontSize: 10,
    color: '#7A8882',
    fontWeight: '800',
    textTransform:
      'uppercase',
  },

  serialColumn: {
    width: 52,
  },

  serviceColumn: {
    flex: 1,
    paddingHorizontal: 5,
  },

  viewColumn: {
    width: 68,
    alignItems:
      'flex-end',
  },

  progressListRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor:
      '#EEF2F0',
  },

  lastProgressRow: {
    borderBottomWidth: 0,
  },

  serialCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor:
      '#F0F8F5',
    alignItems: 'center',
    justifyContent:
      'center',
  },

  serialText: {
    fontSize: 11,
    color: PRIMARY,
    fontWeight: '800',
  },

  serviceName: {
    fontSize: 13,
    color: DARK,
    fontWeight: '700',
  },

  viewButton: {
    minWidth: 58,
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor:
      PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
  },

  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  viewArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    marginLeft: 3,
    marginTop: -2,
  },

  updateButton: {
    height: 54,
    backgroundColor:
      PRIMARY,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
    marginTop: 2,
    marginBottom: 10,
    elevation: 3,
    shadowColor:
      '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },

  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  updateButtonArrow: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
    marginLeft: 8,
    marginTop: -2,
  },
});