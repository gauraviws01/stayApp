import React, {useState} from 'react';

import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';

import Video from 'react-native-video';

const PRIMARY = '#17B978';
const DARK = '#222222';
const BACKGROUND = '#F3F4F8';

const {width, height} = Dimensions.get('window');

const WorkProgressDetail = ({navigation, route}) => {

  const workProgress = route?.params?.workProgress || {};


  const serviceName =
    workProgress?.service_name ||
    workProgress?.staff_service?.service_name ||
    'Service';

  const comments =
    workProgress?.comments || 'No comments added';

  const media = Array.isArray(workProgress?.media)
    ? workProgress.media
    : [];


  const [selectedMedia, setSelectedMedia] = useState(null);

  const [selectedVideo, setSelectedVideo] = useState(null);

  const isVideo = item => {
    const type = String(item?.type || '').toLowerCase();

    const fileName = String(
      item?.file_name ||
        item?.fileName ||
        item?.uri ||
        item?.url ||
        item?.media_url ||
        item?.mediaUrl ||
        item?.file_url ||
        item?.fileUrl ||
        item?.file_path ||
        item?.filePath ||
        item?.path ||
        '',
    ).toLowerCase();

    return (
      type.includes('video') ||
      fileName.includes('.mp4') ||
      fileName.includes('.mov') ||
      fileName.includes('.avi') ||
      fileName.includes('.mkv') ||
      fileName.includes('.webm') ||
      fileName.includes('.m4v')
    );
  };

  const getMediaUrl = item => {
    if (!item) {
      return '';
    }

    const value =
      item?.url ||
      item?.media_url ||
      item?.mediaUrl ||
      item?.file_url ||
      item?.fileUrl ||
      item?.file_path ||
      item?.filePath ||
      item?.path ||
      item?.uri ||
      item?.file_name ||
      item?.fileName ||
      '';

    if (!value) {
      return '';
    }

    let url = String(value).trim();

    url = url.replace(/^["']|["']$/g, '');

    if (
      url.startsWith('http://') ||
      url.startsWith('https://')
    ) {
      if (
        url.includes('/storage/staff-service/')
      ) {
        return url;
      }

      if (
        url.includes('/storage/') &&
        !url.includes('/storage/staff-service/')
      ) {
        const fileName = url.split('/storage/')[1];

        if (fileName) {
          return `https://staysereno.in/storage/staff-service/${fileName}`;
        }
      }

      return url;
    }
    url = url.replace(/^\/+/, '');

    if (url.startsWith('public/storage/')) {
      url = url.replace(/^public\//, '');

      if (!url.startsWith('storage/staff-service/')) {
        url = url.replace(
          /^storage\//,
          'storage/staff-service/',
        );
      }

      return `https://staysereno.in/${url}`;
    }


    if (url.startsWith('storage/')) {
      if (!url.startsWith('storage/staff-service/')) {
        url = url.replace(
          /^storage\//,
          'storage/staff-service/',
        );
      }

      return `https://staysereno.in/${url}`;
    }

    if (url.startsWith('staff-service/')) {
      return `https://staysereno.in/storage/${url}`;
    }

    return `https://staysereno.in/storage/staff-service/${url}`;
  };

  const openVideo = item => {
    const videoUrl = getMediaUrl(item);

    console.log('====================================');
    console.log('OPEN VIDEO');
    console.log('ITEM:', item);
    console.log('VIDEO URL:', videoUrl);
    console.log('MEDIA TYPE:', 'VIDEO');
    console.log('====================================');

    if (!videoUrl) {
      Alert.alert(
        'Video unavailable',
        'Video URL not found.',
      );
      return;
    }

    setSelectedVideo(videoUrl);
  };


  const openMedia = item => {
    const mediaUrl = getMediaUrl(item);

    console.log('====================================');
    console.log('OPEN MEDIA');
    console.log('ITEM:', item);
    console.log('MEDIA URL:', mediaUrl);
    console.log(
      'MEDIA TYPE:',
      isVideo(item) ? 'VIDEO' : 'PHOTO',
    );
    console.log('====================================');

    if (!mediaUrl) {
      Alert.alert(
        'Media unavailable',
        'Media URL not found.',
      );
      return;
    }


    if (isVideo(item)) {
      openVideo(item);
      return;
    }

    setSelectedMedia({
      ...item,
      uri: mediaUrl,
    });
  };


  const closeMedia = () => {
    setSelectedMedia(null);
  };

  const closeVideo = () => {
    setSelectedVideo(null);
  };


  return (
    <View style={styles.container}>

      <StatusBar
        barStyle="dark-content"
        backgroundColor={BACKGROUND}
      />

      <View style={styles.header}>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          style={styles.backButton}>

          <Text style={styles.backArrow}>
            ‹
          </Text>

        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Work Progress
        </Text>

        <View style={styles.headerSpace} />

      </View>

      {/* =================================================
          CONTENT
      ================================================= */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>

        {/* =================================================
            SERVICE
        ================================================= */}

        <View style={styles.card}>

          <Text style={styles.sectionTitle}>
            Service
          </Text>

          <Text style={styles.serviceName}>
            {serviceName}
          </Text>

        </View>

        {/* =================================================
            COMMENTS
        ================================================= */}

        <View style={styles.card}>

          <Text style={styles.sectionTitle}>
            Comments
          </Text>

          <View style={styles.commentsBox}>

            <Text style={styles.commentsText}>
              {comments || 'No comments added'}
            </Text>

          </View>

        </View>

        {/* =================================================
            PHOTO / VIDEO
        ================================================= */}

        <View style={styles.card}>

          {/* MEDIA HEADER */}

          <View style={styles.mediaHeader}>

            <Text style={styles.sectionTitle}>
              Photo / Video
            </Text>

            <View style={styles.mediaCount}>

              <Text style={styles.mediaCountText}>
                {media.length}
              </Text>

            </View>

          </View>

          {/* =================================================
              EMPTY
          ================================================= */}

          {media.length === 0 ? (

            <View style={styles.emptyMedia}>

              <Text style={styles.emptyMediaText}>
                No photo or video added
              </Text>

            </View>

          ) : (

            /* =================================================
                MEDIA GRID
            ================================================= */

            <View style={styles.mediaGrid}>

              {media.map((item, index) => {

                const video = isVideo(item);

                const mediaUrl = getMediaUrl(item);

                return (

                  <TouchableOpacity
                    key={`${item?.id || item?.uri || item?.file_name || index}-${index}`}
                    activeOpacity={0.85}
                    style={styles.mediaItem}
                    onPress={() => openMedia(item)}>

                    {/* =================================================
                        VIDEO
                    ================================================= */}

                    {video ? (

                      <View style={styles.videoBox}>

                        <View style={styles.playCircle}>

                          <Text style={styles.playIcon}>
                            ▶
                          </Text>

                        </View>

                        <Text style={styles.videoText}>
                          Tap to play video
                        </Text>

                      </View>

                    ) : (

                      /* =================================================
                          PHOTO
                      ================================================= */

                      <View style={styles.imageWrapper}>

                        {mediaUrl ? (

                          <Image
                            source={{
                              uri: mediaUrl,
                            }}
                            style={styles.mediaImage}
                            resizeMode="cover"
                            onError={error => {

                              console.log(
                                '====================================',
                              );

                              console.log(
                                'IMAGE LOAD ERROR:',
                                mediaUrl,
                              );

                              console.log(
                                'ERROR:',
                                error?.nativeEvent,
                              );

                              console.log(
                                '====================================',
                              );

                            }}
                          />

                        ) : (

                          <View style={styles.imageError}>

                            <Text
                              style={
                                styles.imageErrorText
                              }>
                              Image unavailable
                            </Text>

                          </View>

                        )}

                      </View>

                    )}

                    {/* =================================================
                        MEDIA TYPE BADGE
                    ================================================= */}

                    <View
                      style={
                        styles.mediaTypeBadge
                      }>

                      <Text
                        style={
                          styles.mediaTypeText
                        }>

                        {video ? 'VIDEO' : 'PHOTO'}

                      </Text>

                    </View>

                  </TouchableOpacity>

                );

              })}

            </View>

          )}

        </View>

      </ScrollView>

      {/* =====================================================
          FULL SCREEN PHOTO MODAL
      ===================================================== */}

      <Modal
        visible={!!selectedMedia}
        transparent={true}
        animationType="fade"
        onRequestClose={closeMedia}>

        <View style={styles.previewContainer}>

          {/* CLOSE BUTTON */}

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.closeButton}
            onPress={closeMedia}>

            <Text style={styles.closeButtonText}>
              ×
            </Text>

          </TouchableOpacity>

          {/* PHOTO */}

          {selectedMedia &&
          !isVideo(selectedMedia) ? (

            <Image
              source={{
                uri: selectedMedia?.uri,
              }}
              style={styles.fullImage}
              resizeMode="contain"
              onError={error => {

                console.log(
                  'FULL IMAGE ERROR:',
                  selectedMedia?.uri,
                  error?.nativeEvent,
                );

              }}
            />

          ) : null}

        </View>

      </Modal>

      {/* =====================================================
          FULL SCREEN VIDEO MODAL
      ===================================================== */}

      <Modal
        visible={!!selectedVideo}
        transparent={true}
        animationType="fade"
        onRequestClose={closeVideo}>

        <View style={styles.videoModalContainer}>

          {/* =================================================
              CLOSE BUTTON
          ================================================= */}

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.videoCloseButton}
            onPress={closeVideo}>

            <Text style={styles.videoCloseButtonText}>
              ×
            </Text>

          </TouchableOpacity>

          {/* =================================================
              VIDEO PLAYER
          ================================================= */}

          {selectedVideo ? (

            <Video
              source={{
                uri: selectedVideo,
              }}
              style={styles.fullVideo}
              controls={true}
              paused={false}
              resizeMode="contain"

              /* Android buffering */
              bufferConfig={{
                minBufferMs: 15000,
                maxBufferMs: 50000,
                bufferForPlaybackMs: 2500,
                bufferForPlaybackAfterRebufferMs: 5000,
              }}

              onLoad={() => {
                console.log(
                  '====================================',
                );
                console.log(
                  'VIDEO LOADED SUCCESSFULLY',
                );
                console.log(
                  'VIDEO URL:',
                  selectedVideo,
                );
                console.log(
                  '====================================',
                );
              }}

              onError={error => {

                console.log(
                  '====================================',
                );

                console.log(
                  'VIDEO PLAY ERROR:',
                  error,
                );

                console.log(
                  'VIDEO URL:',
                  selectedVideo,
                );

                console.log(
                  '====================================',
                );

                Alert.alert(
                  'Video Error',
                  'Unable to play this video. Please check the video file or server URL.',
                );

              }}

              onBuffer={({isBuffering}) => {

                console.log(
                  'VIDEO BUFFERING:',
                  isBuffering,
                );

              }}
            />

          ) : null}

        </View>

      </Modal>

    </View>
  );
};

export default WorkProgressDetail;

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({

  // =====================================================
  // CONTAINER
  // =====================================================

  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
    paddingTop: 32,
    paddingBottom: 32,
  },

  // =====================================================
  // HEADER
  // =====================================================

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

  // =====================================================
  // CONTENT
  // =====================================================

  content: {
    padding: 16,
    paddingBottom: 30,
  },

  // =====================================================
  // CARD
  // =====================================================

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

  // =====================================================
  // SECTION TITLE
  // =====================================================

  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7A8882',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // =====================================================
  // SERVICE
  // =====================================================

  serviceName: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '800',
    color: DARK,
  },

  // =====================================================
  // COMMENTS
  // =====================================================

  commentsBox: {
    backgroundColor: '#F7F9F8',
    borderRadius: 12,
    padding: 14,
    minHeight: 85,
    justifyContent: 'center',
  },

  commentsText: {
    fontSize: 14,
    lineHeight: 21,
    color: DARK,
    fontWeight: '500',
  },

  // =====================================================
  // MEDIA HEADER
  // =====================================================

  mediaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  mediaCount: {
    minWidth: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0F8F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  mediaCountText: {
    fontSize: 12,
    color: PRIMARY,
    fontWeight: '800',
  },

  // =====================================================
  // EMPTY MEDIA
  // =====================================================

  emptyMedia: {
    minHeight: 80,
    borderRadius: 12,
    backgroundColor: '#F7F9F8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyMediaText: {
    fontSize: 13,
    color: '#9AA5A0',
    fontWeight: '500',
  },

  // =====================================================
  // MEDIA GRID
  // =====================================================

  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },

  mediaItem: {
    width: '50%',
    padding: 5,
    position: 'relative',
  },

  // =====================================================
  // IMAGE
  // =====================================================

  imageWrapper: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#EDEFEF',
  },

  mediaImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#EDEFEF',
  },

  imageError: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECEFEE',
  },

  imageErrorText: {
    fontSize: 11,
    color: '#8A9691',
    fontWeight: '600',
    textAlign: 'center',
  },

  // =====================================================
  // VIDEO THUMBNAIL
  // =====================================================

  videoBox: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    backgroundColor: '#E8ECEA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  playCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },

  playIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    marginLeft: 3,
  },

  videoText: {
    marginTop: 7,
    fontSize: 11,
    color: DARK,
    fontWeight: '700',
  },

  // =====================================================
  // MEDIA BADGE
  // =====================================================

  mediaTypeBadge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#222222',
  },

  mediaTypeText: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // =====================================================
  // PHOTO MODAL
  // =====================================================

  previewContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeButton: {
    position: 'absolute',
    top: 45,
    right: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 32,
    lineHeight: 35,
    fontWeight: '300',
  },

  fullImage: {
    width: width,
    height: height * 0.8,
  },

  // =====================================================
  // VIDEO MODAL
  // =====================================================

  videoModalContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },

  videoCloseButton: {
    position: 'absolute',
    top: 45,
    right: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },

  videoCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 32,
    lineHeight: 35,
    fontWeight: '300',
  },

  fullVideo: {
    width: width,
    height: height * 0.75,
  },

});