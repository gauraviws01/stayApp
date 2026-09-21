import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from 'react-native';

const CaretakerDetailScreen = ({navigation}) => {
  const [selectedProperty, setSelectedProperty] = useState(
    'Sereno Greens - Cosy 1 BHK with Pvt Balcony',
  );
  const [isPropertyOpen, setIsPropertyOpen] = useState(false);

  const propertyOptions = [
    'Sereno Greens - Cosy 1 BHK with Pvt Balcony',
    'Sereno Ikigai - 4BHK Villa with Pool',
    'Sereno Bloom - Penthouse Suite',
  ];

  const caretakerList = [
    {
      name: 'Ravi Kumar',
      role: 'Housekeeping Lead',
      phone: '+91 98765 43210',
      shift: 'Morning shift',
    },
    {
      name: 'Asha Verma',
      role: 'Guest Support',
      phone: '+91 99887 66554',
      shift: 'Evening shift',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F7F4" />

      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation?.goBack?.()}
            style={styles.backButton}>
            <Text style={styles.backText}>{'‹'}</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Caretaker</Text>

          <View style={styles.placeholder} />
        </View>

        <View style={styles.propertySelectorWrap}>
          <Text style={styles.propertyLabel}>PROPERTY</Text>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.propertySelector}
            onPress={() => setIsPropertyOpen(!isPropertyOpen)}>
            <Text style={styles.propertyText} numberOfLines={1}>
              {selectedProperty}
            </Text>
            <Text style={styles.propertyChevron}>{isPropertyOpen ? '⌃' : '⌄'}</Text>
          </TouchableOpacity>

          {isPropertyOpen && (
            <View style={styles.dropdownMenu}>
              {propertyOptions.map(option => (
                <TouchableOpacity
                  key={option}
                  activeOpacity={0.8}
                  style={[
                    styles.dropdownItem,
                    selectedProperty === option && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    setSelectedProperty(option);
                    setIsPropertyOpen(false);
                  }}>
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedProperty === option && styles.dropdownItemTextActive,
                    ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.heroCard}>
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>👥</Text>
            </View>

            <Text style={styles.heroTitle}>On-property support</Text>
            <Text style={styles.heroSubtitle}>Staff contacts & shift coverage</Text>
          </View>

          {caretakerList.map(item => (
            <View key={item.name} style={styles.personCard}>
              <View style={styles.avatarWrap}>
                <Text style={styles.avatarText}>{item.name.slice(0, 2).toUpperCase()}</Text>
              </View>

              <View style={styles.personInfo}>
                <Text style={styles.personName}>{item.name}</Text>
                <Text style={styles.personRole}>{item.role}</Text>
              </View>

              <View style={styles.metaBlock}>
                <Text style={styles.metaLabel}>Phone</Text>
                <Text style={styles.metaValue}>{item.phone}</Text>
                <Text style={styles.metaLabel}>Shift</Text>
                <Text style={styles.metaValue}>{item.shift}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F7F4',
  },
  container: {
    flex: 1,
    backgroundColor: '#F3F7F4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
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
  backText: {
    fontSize: 28,
    color: '#111827',
    lineHeight: 28,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2D2A',
  },
  placeholder: {
    width: 36,
    height: 36,
  },
  propertySelectorWrap: {
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  propertyLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#5F7D72',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  propertySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EAF5F0',
    borderWidth: 1,
    borderColor: '#D8EAE2',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  propertyText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2D2A',
    marginRight: 10,
  },
  propertyChevron: {
    fontSize: 18,
    color: '#1F2D2A',
    fontWeight: '700',
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDEAE4',
    marginTop: 8,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF3F1',
  },
  dropdownItemActive: {
    backgroundColor: '#EAF7F2',
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#1F2D2A',
    fontWeight: '600',
  },
  dropdownItemTextActive: {
    color: '#0E8C66',
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDEAE4',
    padding: 20,
    alignItems: 'center',
    marginBottom: 18,
  },
  iconWrap: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: '#F4EEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 30,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2D2A',
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#6E8B84',
    marginTop: 4,
  },
  personCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDEAE4',
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1DBA78',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2D2A',
  },
  personRole: {
    color: '#6E8B84',
    fontSize: 12,
    marginTop: 4,
  },
  metaBlock: {
    marginLeft: 10,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6E8B84',
    textTransform: 'uppercase',
    marginTop: 6,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2D2A',
  },
});

export default CaretakerDetailScreen;
