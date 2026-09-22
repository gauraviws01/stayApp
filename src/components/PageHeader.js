import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const PageHeader = ({navigation, title, showMenu = false, onMenuPress}) => {
  const insets = useSafeAreaInsets();

  const handleMenuPress = () => {
    if (showMenu) {
      onMenuPress?.();
      if (onMenuPress) {
        return;
      }
      navigation?.navigate?.('MainApp', {openDrawer: true});
      return;
    }

    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation?.navigate?.('MainApp');
  };

  return (
    <View style={[styles.header, {paddingTop: Math.max(insets.top, 16) + 8}]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleMenuPress}
        style={styles.backButton}>
        <Text style={showMenu ? styles.menuText : styles.backText}>
          {showMenu ? '☰' : '‹'}
        </Text>
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.placeholder} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAF5F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {fontSize: 30, color: '#17B978', lineHeight: 30},
  menuText: {fontSize: 22, color: '#17B978', lineHeight: 24},
  title: {fontSize: 18, fontWeight: '800', color: '#1F2D2A'},
  placeholder: {width: 36, height: 36},
});

export default PageHeader;
