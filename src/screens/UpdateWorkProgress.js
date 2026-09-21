import React, {useEffect, useState} from 'react';

import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {Picker} from '@react-native-picker/picker';

import {
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';

const PRIMARY = '#17B978';
const DARK = '#222222';
const BACKGROUND = '#F3F4F8';

const SERVICES_API =
  'https://staysereno.in/api/staff/services';

const WORK_PROGRESS_API =
  'https://staysereno.in/api/staff/service/work-progress';

const UpdateWorkProgress = ({
  navigation,
  route,
}) => {
  const booking =
    route?.params?.booking || {};

  const property =
    route?.params?.property || {};

  // =====================================================
  // STATE
  // =====================================================

  const [serviceType, setServiceType] =
    useState([]);

  const [services, setServices] =
    useState([]);

  const [servicesLoading, setServicesLoading] =
    useState(false);

  const [comments, setComments] =
    useState('');

  const [media, setMedia] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  // =====================================================
  // PROPERTY NAME
  // =====================================================

  const propertyName =
    property?.final_unit_name ||
    property?.unit_name ||
    property?.unitName ||
    property?.property_name ||
    property?.name ||
    booking?.propertyName ||
    'Unknown Property';

  // =====================================================
  // BOOKING ID
  // =====================================================

  const bookingId =
    booking?.bookingId ||
    booking?.booking_id ||
    booking?.id ||
    '';

  // =====================================================
  // BLOCKED STATUS
  // =====================================================

  const isBlocked =
    Number(
      booking?.is_blocked ??
        booking?.isBlocked ??
        booking?.blocked ??
        0,
    ) === 1
      ? 1
      : 0;

  // =====================================================
  // AUTH TOKEN
  // =====================================================

  const getAuthToken = async () => {
    try {
      const token =
        (await AsyncStorage.getItem('token')) ||
        (await AsyncStorage.getItem('access_token')) ||
        (await AsyncStorage.getItem('authToken')) ||
        (await AsyncStorage.getItem('userToken'));

      return token;
    } catch (error) {
      console.log(
        'TOKEN ERROR:',
        error?.message || error,
      );

      return null;
    }
  };

  // =====================================================
  // USER ID
  // =====================================================

  const getUserId = async () => {
    try {
      const storedUserId =
        (await AsyncStorage.getItem('userId')) ||
        (await AsyncStorage.getItem('user_id'));

      if (storedUserId) {
        return storedUserId;
      }

      const userData =
        (await AsyncStorage.getItem('user')) ||
        (await AsyncStorage.getItem('userData'));

      if (userData) {
        try {
          const user =
            JSON.parse(userData);

          const userId =
            user?.id ??
            user?.user_id ??
            user?.userId;

          if (
            userId !== undefined &&
            userId !== null
          ) {
            return String(userId);
          }
        } catch (parseError) {
          console.log(
            'USER JSON PARSE ERROR:',
            parseError,
          );
        }
      }

      return null;
    } catch (error) {
      console.log(
        'USER ID ERROR:',
        error?.message || error,
      );

      return null;
    }
  };

  // =====================================================
  // FETCH SERVICES
  // =====================================================

  const fetchServices = async () => {
    try {
      setServicesLoading(true);

      const token =
        await getAuthToken();

      const headers = {
        Accept: 'application/json',
      };

      if (token) {
        headers.Authorization =
          `Bearer ${token}`;
      }

      const response = await fetch(
        SERVICES_API,
        {
          method: 'GET',
          headers,
        },
      );

      const responseText =
        await response.text();

      console.log(
        'SERVICES RESPONSE:',
        responseText,
      );

      let result;

      try {
        result =
          JSON.parse(responseText);
      } catch (error) {
        throw new Error(
          'Invalid server response.',
        );
      }

      if (!response.ok) {
        throw new Error(
          result?.message ||
            `Request failed with status ${response.status}`,
        );
      }

      if (!result?.status) {
        throw new Error(
          result?.message ||
            'Unable to fetch services.',
        );
      }

      const serviceList =
        Array.isArray(result?.data)
          ? result.data
          : [];

      const activeServices =
        serviceList.filter(
          item =>
            Number(item?.status) === 1,
        );

      setServices(activeServices);
    } catch (error) {
      console.log(
        'FETCH SERVICES ERROR:',
        error?.message || error,
      );

      setServices([]);

      Alert.alert(
        'Error',
        error?.message ||
          'Unable to load service types.',
      );
    } finally {
      setServicesLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchServices();

    console.log(
      '====================================',
    );

    console.log(
      'BOOKING OBJECT:',
      JSON.stringify(
        booking,
        null,
        2,
      ),
    );

    console.log(
      'BOOKING ID:',
      bookingId,
    );

    console.log(
      'IS BLOCKED:',
      isBlocked,
    );

    console.log(
      '====================================',
    );
  }, []);

  // =====================================================
  // MEDIA OPTIONS
  // =====================================================

  const openMediaOptions = () => {
    if (media.length >= 10) {
      Alert.alert(
        'Limit Reached',
        'You can upload maximum 10 photos or videos.',
      );

      return;
    }

    Alert.alert(
      'Upload Media',
      'Select an option',
      [
        {
          text: 'Take Photo',
          onPress: openCamera,
        },
        {
          text: 'Record',
          onPress: openVideoCamera,
        },
        {
          text: 'Gallery',
          onPress: openGallery,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
    );
  };

  // =====================================================
  // TAKE PHOTO
  // =====================================================

  const openCamera = () => {
    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
      },
      response => {
        if (response.didCancel) {
          return;
        }

        if (response.errorCode) {
          Alert.alert(
            'Error',
            response.errorMessage ||
              'Unable to open camera.',
          );

          return;
        }

        if (
          response.assets &&
          response.assets.length
        ) {
          const availableSlots =
            10 - media.length;

          const selectedAssets =
            response.assets.slice(
              0,
              availableSlots,
            );

          setMedia(prev => [
            ...prev,
            ...selectedAssets,
          ]);
        }
      },
    );
  };

  // =====================================================
  // RECORD VIDEO
  // =====================================================

  const openVideoCamera = () => {
    if (media.length >= 10) {
      Alert.alert(
        'Limit Reached',
        'You can upload maximum 10 photos or videos.',
      );

      return;
    }

    launchCamera(
      {
        mediaType: 'video',
        videoQuality: 'medium',
        durationLimit: 60,
      },
      response => {
        if (response.didCancel) {
          return;
        }

        if (response.errorCode) {
          Alert.alert(
            'Error',
            response.errorMessage ||
              'Unable to open video camera.',
          );

          return;
        }

        if (
          response.assets &&
          response.assets.length
        ) {
          const video =
            response.assets[0];

          if (video?.uri) {
            setMedia(prev => [
              ...prev,
              video,
            ]);
          }
        }
      },
    );
  };

  // =====================================================
  // GALLERY
  // =====================================================

  const openGallery = () => {
    const availableSlots =
      10 - media.length;

    if (availableSlots <= 0) {
      Alert.alert(
        'Limit Reached',
        'You can upload maximum 10 photos or videos.',
      );

      return;
    }

    launchImageLibrary(
      {
        mediaType: 'mixed',
        selectionLimit: availableSlots,
        quality: 0.8,
        videoQuality: 'medium',
      },
      response => {
        if (response.didCancel) {
          return;
        }

        if (response.errorCode) {
          Alert.alert(
            'Error',
            response.errorMessage ||
              'Unable to open gallery.',
          );

          return;
        }

        if (
          response.assets &&
          response.assets.length
        ) {
          const available =
            10 - media.length;

          const selectedAssets =
            response.assets.slice(
              0,
              available,
            );

          setMedia(prev => [
            ...prev,
            ...selectedAssets,
          ]);
        }
      },
    );
  };

  // =====================================================
  // REMOVE MEDIA
  // =====================================================

  const removeMedia = index => {
    setMedia(prev =>
      prev.filter(
        (_, i) => i !== index,
      ),
    );
  };

  // =====================================================
  // CHECK VIDEO
  // =====================================================

  const isVideo = item => {
    const type =
      String(item?.type || '')
        .toLowerCase();

    const fileName =
      String(
        item?.fileName ||
          item?.file_name ||
          item?.uri ||
          '',
      ).toLowerCase();

    return (
      type.startsWith('video/') ||
      fileName.endsWith('.mp4') ||
      fileName.endsWith('.mov') ||
      fileName.endsWith('.avi') ||
      fileName.endsWith('.mkv') ||
      fileName.endsWith('.webm') ||
      fileName.endsWith('.m4v') ||
      fileName.endsWith('.3gp')
    );
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async () => {
    if (
      !Array.isArray(serviceType) ||
      serviceType.length === 0
    ) {
      Alert.alert(
        'Required',
        'Please select type of service.',
      );

      return;
    }

    if (!comments.trim()) {
      Alert.alert(
        'Required',
        'Please add comments.',
      );

      return;
    }

    try {
      setLoading(true);

      const token =
        await getAuthToken();

      const userId =
        await getUserId();

      if (!userId) {
        setLoading(false);

        Alert.alert(
          'Error',
          'User ID not found. Please login again.',
        );

        return;
      }

      // =================================================
      // UNIT ID
      // =================================================

      const unitId =
        booking?.unit_id ??
        booking?.unitId ??
        property?.unit_id ??
        property?.unitId ??
        property?.id ??
        '';

      // =================================================
      // DATES
      // =================================================

      const dateFrom =
        booking?.startDate ??
        booking?.date_from ??
        booking?.dateFrom ??
        '';

      const dateTo =
        booking?.endDate ??
        booking?.date_to ??
        booking?.dateTo ??
        '';

      // =================================================
      // STATUS
      // =================================================

      const blockedStatus =
        booking?.isBlocked === true ||
        Number(booking?.is_blocked) === 1 ||
        booking?.blocked === true
          ? 1
          : 0;

      const bookedStatus =
        booking?.isBooked === true ||
        Number(booking?.is_booked) === 1
          ? 1
          : 0;

      // =================================================
      // ACTUAL BOOKING ID
      // =================================================

      let actualBookingId =
        booking?.realBookingId ??
        booking?.actualBookingId ??
        booking?.booking_id ??
        null;

      if (
        actualBookingId !== null &&
        actualBookingId !== undefined &&
        actualBookingId !== ''
      ) {
        actualBookingId =
          Number(actualBookingId);

        if (
          Number.isNaN(actualBookingId)
        ) {
          actualBookingId = null;
        }
      }

      // =================================================
      // VALIDATION
      // =================================================

      if (!unitId) {
        setLoading(false);

        Alert.alert(
          'Error',
          'Unit ID is missing.',
        );

        return;
      }

      if (!dateFrom || !dateTo) {
        setLoading(false);

        Alert.alert(
          'Error',
          'Booking/block dates are missing.',
        );

        return;
      }

      // =================================================
      // FORM DATA
      // =================================================

      const formData =
        new FormData();

      // USER
      formData.append(
        'user_id',
        String(userId),
      );

      // UNIT
      formData.append(
        'unit_id',
        String(unitId),
      );

      // SERVICE TYPES
      serviceType.forEach(
        typeId => {
          formData.append(
            'service_type[]',
            String(typeId),
          );
        },
      );

      // BOOKING ID
      if (
        actualBookingId !== null &&
        actualBookingId !== undefined
      ) {
        formData.append(
          'booking_id',
          String(actualBookingId),
        );
      }

      // DATES
      formData.append(
        'date_from',
        String(dateFrom),
      );

      formData.append(
        'date_to',
        String(dateTo),
      );

      // STATUS
      formData.append(
        'is_booked',
        String(bookedStatus),
      );

      formData.append(
        'is_blocked',
        String(blockedStatus),
      );

      // COMMENTS
      formData.append(
        'comments',
        comments.trim(),
      );

      // =================================================
      // MEDIA
      // =================================================

      media.forEach(
        (item, index) => {
          if (!item?.uri) {
            return;
          }

          const video =
            isVideo(item);

          const mediaType =
            video ? 'video' : 'photo';

          let fileName =
            item?.fileName ||
            item?.file_name;

          if (!fileName) {
            fileName =
              `work_progress_${Date.now()}_${index}.${
                video ? 'mp4' : 'jpg'
              }`;
          }

          const fileType =
            item?.type ||
            (video
              ? 'video/mp4'
              : 'image/jpeg');

          formData.append(
            'media[]',
            {
              uri: item.uri,
              type: fileType,
              name: fileName,
            },
          );

          formData.append(
            'media_type[]',
            mediaType,
          );
        },
      );

      // =================================================
      // DEBUG LOG
      // =================================================

      console.log(
        '====================================',
      );

      console.log(
        'WORK PROGRESS API:',
        WORK_PROGRESS_API,
      );

      console.log(
        'USER ID:',
        userId,
      );

      console.log(
        'UNIT ID:',
        unitId,
      );

      console.log(
        'SERVICE TYPES:',
        serviceType,
      );

      console.log(
        'SERVICE TYPE COUNT:',
        serviceType.length,
      );

      console.log(
        'BOOKING ID:',
        actualBookingId,
      );

      console.log(
        'DATE FROM:',
        dateFrom,
      );

      console.log(
        'DATE TO:',
        dateTo,
      );

      console.log(
        'IS BOOKED:',
        bookedStatus,
      );

      console.log(
        'IS BLOCKED:',
        blockedStatus,
      );

      console.log(
        'COMMENTS:',
        comments.trim(),
      );

      console.log(
        'MEDIA COUNT:',
        media.length,
      );

      console.log(
        'MEDIA:',
        media,
      );

      console.log(
        '====================================',
      );

      // =================================================
      // HEADERS
      // =================================================

      const headers = {
        Accept: 'application/json',
      };

      if (token) {
        headers.Authorization =
          `Bearer ${token}`;
      }

      // =================================================
      // API REQUEST
      // =================================================

      const response =
        await fetch(
          WORK_PROGRESS_API,
          {
            method: 'POST',
            headers,
            body: formData,
          },
        );

      const responseText =
        await response.text();

      console.log(
        'WORK PROGRESS RESPONSE:',
        responseText,
      );

      let result = null;

      try {
        result =
          JSON.parse(responseText);
      } catch (error) {
        console.log(
          'JSON PARSE ERROR:',
          error,
        );
      }

      // =================================================
      // RESPONSE VALIDATION
      // =================================================

      if (!response.ok) {
        throw new Error(
          result?.message ||
            `Request failed with status ${response.status}`,
        );
      }

      if (
        result &&
        result.status === false
      ) {
        throw new Error(
          result?.message ||
            'Unable to update work progress.',
        );
      }

      // =================================================
      // SUCCESS
      // =================================================

      setLoading(false);

      Alert.alert(
        'Success',
        result?.message ||
          'Work progress updated successfully.',
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
        'WORK PROGRESS ERROR:',
        error?.message || error,
      );

      setLoading(false);

      Alert.alert(
        'Error',
        error?.message ||
          'Something went wrong. Please try again.',
      );
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      {/* HEADER */}

      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() =>
            navigation.goBack()
          }
          style={styles.backButton}>
          <Text style={styles.backArrow}>
            ‹
          </Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Update Work Progress
        </Text>

        <View style={styles.headerSpace} />
      </View>

      {/* CONTENT */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.content
        }>

        {/* PROPERTY */}

        <View style={styles.propertyCard}>
          <View style={styles.propertyIcon}>
            <Text
              style={
                styles.propertyIconText
              }>
              ✓
            </Text>
          </View>

          <View style={styles.propertyInfo}>
            <Text
              style={
                styles.propertyLabel
              }>
              PROPERTY
            </Text>

            <Text
              style={
                styles.propertyName
              }
              numberOfLines={2}>
              {propertyName}
            </Text>
          </View>
        </View>

        {/* FORM CARD */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Service Details
          </Text>

          {/* SERVICE TYPE */}

          <Text style={styles.inputLabel}>
            Select Type of Service
          </Text>

          <View
            style={
              styles.pickerContainer
            }>
            {servicesLoading ? (
              <View
                style={
                  styles.pickerLoading
                }>
                <ActivityIndicator
                  size="small"
                  color={PRIMARY}
                />

                <Text
                  style={
                    styles.loadingText
                  }>
                  Loading services...
                </Text>
              </View>
            ) : (
              <Picker
                selectedValue=""
                onValueChange={value => {
                  if (!value) {
                    return;
                  }

                  const selectedId =
                    String(value);

                  setServiceType(prev => {
                    if (
                      prev.includes(
                        selectedId,
                      )
                    ) {
                      return prev;
                    }

                    return [
                      ...prev,
                      selectedId,
                    ];
                  });
                }}
                style={styles.picker}
                dropdownIconColor={
                  DARK
                }>
                <Picker.Item
                  label="Select service type"
                  value=""
                />

                {services.map(
                  service => (
                    <Picker.Item
                      key={String(
                        service.id,
                      )}
                      label={
                        service.service_name
                      }
                      value={String(
                        service.id,
                      )}
                    />
                  ),
                )}
              </Picker>
            )}
          </View>

          {/* SELECTED SERVICES */}

          {serviceType.length > 0 && (
            <View
              style={
                styles.selectedServicesContainer
              }>
              {serviceType.map(
                (serviceId, index) => {
                  const selectedService =
                    services.find(
                      service =>
                        String(
                          service.id,
                        ) ===
                        String(
                          serviceId,
                        ),
                    );

                  return (
                    <View
                      key={`${serviceId}-${index}`}
                      style={
                        styles.selectedServiceItem
                      }>
                      <Text
                        style={
                          styles.selectedServiceText
                        }>
                        {selectedService
                          ?.service_name ||
                          serviceId}
                      </Text>

                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                          setServiceType(
                            prev =>
                              prev.filter(
                                id =>
                                  String(
                                    id,
                                  ) !==
                                  String(
                                    serviceId,
                                  ),
                              ),
                          );
                        }}
                        style={
                          styles.selectedServiceRemove
                        }>
                        <Text
                          style={
                            styles.selectedServiceRemoveText
                          }>
                          ×
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                },
              )}
            </View>
          )}

          {!servicesLoading &&
            services.length === 0 && (
              <Text
                style={
                  styles.noServicesText
                }>
                No active services available.
              </Text>
            )}

          {/* COMMENTS */}

          <Text style={styles.inputLabel}>
            Add Comments
          </Text>

          <TextInput
            value={comments}
            onChangeText={setComments}
            placeholder="Enter work details or comments..."
            placeholderTextColor="#A5AEA9"
            multiline
            textAlignVertical="top"
            style={
              styles.commentsInput
            }
          />

          {/* MEDIA HEADER */}

          <View
            style={
              styles.mediaHeader
            }>
            <View>
              <Text
                style={
                  styles.inputLabel
                }>
                Upload Photos & Videos
              </Text>

              <Text
                style={
                  styles.mediaHint
                }>
                Add photos or videos of the work
              </Text>
            </View>

            <Text
              style={
                styles.mediaCount
              }>
              {media.length}/10
            </Text>
          </View>

          {/* UPLOAD BUTTON */}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={
              openMediaOptions
            }
            disabled={
              media.length >= 10
            }
            style={[
              styles.uploadButton,
              media.length >= 10 &&
                styles.uploadButtonDisabled,
            ]}>
            <View
              style={
                styles.uploadIconCircle
              }>
              <Text
                style={
                  styles.uploadIcon
                }>
                +
              </Text>
            </View>

            <View
              style={
                styles.uploadTextContainer
              }>
              <Text
                style={
                  styles.uploadTitle
                }>
                Add Photos or Videos
              </Text>

              <Text
                style={
                  styles.uploadSubtitle
                }>
                Take Photo • Record Video • Gallery
              </Text>
            </View>

            <Text
              style={
                styles.uploadArrow
              }>
              ›
            </Text>
          </TouchableOpacity>

          {/* MEDIA PREVIEW */}

          {media.length > 0 && (
            <View
              style={
                styles.mediaGrid
              }>
              {media.map(
                (item, index) => (
                  <View
                    key={`${item?.uri || index}-${index}`}
                    style={
                      styles.mediaItem
                    }>
                    {isVideo(item) ? (
                      <View
                        style={
                          styles.videoPreview
                        }>
                        <Text
                          style={
                            styles.videoIcon
                          }>
                          ▶
                        </Text>

                        <Text
                          style={
                            styles.videoText
                          }>
                          VIDEO
                        </Text>
                      </View>
                    ) : (
                      <Image
                        source={{
                          uri: item.uri,
                        }}
                        style={
                          styles.mediaImage
                        }
                      />
                    )}

                    {/* REMOVE */}

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() =>
                        removeMedia(
                          index,
                        )
                      }
                      style={
                        styles.removeButton
                      }>
                      <Text
                        style={
                          styles.removeText
                        }>
                        ×
                      </Text>
                    </TouchableOpacity>
                  </View>
                ),
              )}
            </View>
          )}
        </View>

        {/* SUBMIT BUTTON */}

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={loading}
          onPress={
            handleSubmit
          }
          style={[
            styles.submitButton,
            loading &&
              styles.submitButtonDisabled,
          ]}>
          {loading ? (
            <View
              style={
                styles.submitLoading
              }>
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.submitButtonText
                }>
                Updating...
              </Text>
            </View>
          ) : (
            <Text
              style={
                styles.submitButtonText
              }>
              Update Work Progress
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default UpdateWorkProgress;

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
    paddingTop: 32,
    paddingBottom:32,
  },

  // HEADER

  header: {
    height: 62,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },

  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backArrow: {
    fontSize: 38,
    lineHeight: 40,
    color: DARK,
    fontWeight: '300',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: DARK,
  },

  headerSpace: {
    width: 42,
  },

  // CONTENT

  content: {
    padding: 16,
    paddingBottom: 35,
  },

  // PROPERTY

  propertyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },

  propertyIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EAF9F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  propertyIconText: {
    color: PRIMARY,
    fontSize: 20,
    fontWeight: '800',
  },

  propertyInfo: {
    flex: 1,
  },

  propertyLabel: {
    fontSize: 10,
    color: '#8A9690',
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 3,
  },

  propertyName: {
    fontSize: 15,
    color: DARK,
    fontWeight: '800',
    lineHeight: 21,
  },

  // STATUS CARD

  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },

  statusLabel: {
    fontSize: 10,
    color: '#8A9690',
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },

  statusTitle: {
    fontSize: 15,
    color: DARK,
    fontWeight: '800',
  },

  statusBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },

  blockedBadge: {
    backgroundColor: '#F3F3F3',
  },

  bookingBadge: {
    backgroundColor: '#EAF9F2',
  },

  statusBadgeText: {
    fontSize: 16,
    fontWeight: '900',
  },

  blockedText: {
    color: DARK,
  },

  bookingText: {
    color: PRIMARY,
  },

  // CARD

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#000000',
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
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // INPUT

  inputLabel: {
    fontSize: 13,
    color: DARK,
    fontWeight: '700',
    marginBottom: 8,
  },

  pickerContainer: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E2E8E4',
    borderRadius: 10,
    backgroundColor: '#FAFCFB',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 18,
  },

  picker: {
    color: DARK,
    width: '100%',
    height: 52,
  },

  pickerLoading: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },

  loadingText: {
    marginLeft: 9,
    fontSize: 13,
    color: '#7A8882',
    fontWeight: '600',
  },

  noServicesText: {
    fontSize: 12,
    color: '#E53935',
    marginTop: -10,
    marginBottom: 14,
  },

  // SELECTED SERVICES

  selectedServicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: -8,
    marginBottom: 14,
  },

  selectedServiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF9F2',
    borderRadius: 8,
    paddingLeft: 10,
    paddingRight: 5,
    paddingVertical: 6,
    marginRight: 7,
    marginBottom: 7,
  },

  selectedServiceText: {
    color: DARK,
    fontSize: 12,
    fontWeight: '700',
  },

  selectedServiceRemove: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },

  selectedServiceRemoveText: {
    color: '#E53935',
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '700',
  },

  // COMMENTS

  commentsInput: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E2E8E4',
    borderRadius: 10,
    backgroundColor: '#FAFCFB',
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 14,
    color: DARK,
    lineHeight: 20,
    marginBottom: 20,
  },

  // MEDIA

  mediaHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 9,
  },

  mediaHint: {
    fontSize: 11,
    color: '#9AA59F',
    marginTop: -4,
    marginBottom: 8,
  },

  mediaCount: {
    fontSize: 12,
    color: PRIMARY,
    fontWeight: '800',
    marginBottom: 9,
  },

  uploadButton: {
    minHeight: 74,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#A9DCC8',
    borderRadius: 12,
    backgroundColor: '#F5FCF8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },


  
mediaOptionOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.45)',
  justifyContent: 'flex-end',
},

mediaOptionContainer: {
  backgroundColor: '#FFFFFF',
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  paddingHorizontal: 18,
  paddingTop: 10,
  paddingBottom: 30,
},

mediaOptionHandle: {
  width: 42,
  height: 5,
  borderRadius: 3,
  backgroundColor: '#D8DED9',
  alignSelf: 'center',
  marginBottom: 18,
},

mediaOptionTitle: {
  fontSize: 18,
  fontWeight: '800',
  color: DARK,
  marginBottom: 5,
},

mediaOptionSubtitle: {
  fontSize: 12,
  color: '#8A9690',
  marginBottom: 18,
},

mediaOptionButton: {
  height: 62,
  borderRadius: 14,
  backgroundColor: '#F7FAF8',
  borderWidth: 1,
  borderColor: '#E5EBE7',
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 14,
  marginBottom: 10,
},

mediaOptionIcon: {
  width: 42,
  height: 42,
  borderRadius: 12,
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 12,
},

photoOptionIcon: {
  backgroundColor: '#EAF9F2',
},

videoOptionIcon: {
  backgroundColor: '#EAF1FF',
},

galleryOptionIcon: {
  backgroundColor: '#FFF4E5',
},

mediaOptionIconText: {
  fontSize: 20,
  fontWeight: '800',
},

photoOptionIconText: {
  color: PRIMARY,
},

videoOptionIconText: {
  color: '#3478F6',
},

galleryOptionIconText: {
  color: '#F39C12',
},

mediaOptionTextContainer: {
  flex: 1,
},

mediaOptionText: {
  fontSize: 14,
  fontWeight: '800',
  color: DARK,
},

mediaOptionDescription: {
  fontSize: 11,
  color: '#8A9690',
  marginTop: 3,
},

mediaOptionArrow: {
  fontSize: 25,
  color: '#9AA59F',
  fontWeight: '300',
},

mediaCancelButton: {
  height: 52,
  borderRadius: 14,
  backgroundColor: '#F1F3F2',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 4,
},

mediaCancelText: {
  fontSize: 14,
  color: '#555F5A',
  fontWeight: '700',
},

  uploadButtonDisabled: {
    opacity: 0.55,
  },

  uploadIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#E1F7EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  uploadIcon: {
    fontSize: 26,
    color: PRIMARY,
    fontWeight: '400',
    marginTop: -2,
  },

  uploadTextContainer: {
    flex: 1,
  },

  uploadTitle: {
    fontSize: 13,
    color: DARK,
    fontWeight: '800',
  },

  uploadSubtitle: {
    fontSize: 11,
    color: '#8C9993',
    marginTop: 3,
  },

  uploadArrow: {
    fontSize: 25,
    color: '#8C9993',
    fontWeight: '300',
  },

  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    marginHorizontal: -4,
  },

  mediaItem: {
    width: '33.333%',
    aspectRatio: 1,
    padding: 4,
    position: 'relative',
  },

  mediaImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#EEF2F0',
  },

  videoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#222222',
    alignItems: 'center',
    justifyContent: 'center',
  },

  videoIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    marginBottom: 4,
  },

  videoText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  removeButton: {
    position: 'absolute',
    right: 1,
    top: 1,
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },

  removeText: {
    color: '#E53935',
    fontSize: 19,
    lineHeight: 21,
    fontWeight: '700',
    marginTop: -2,
  },

  // SUBMIT

  submitButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },

  submitButtonDisabled: {
    opacity: 0.6,
  },

  submitLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 8,
  },
});