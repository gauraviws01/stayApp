import React from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  View, 
  Text, 
  TouchableOpacity,
  StatusBar, 
  SafeAreaView, 
  useWindowDimensions
} from 'react-native';
import RenderHtml from 'react-native-render-html';

import PropertyDropdown from '../components/PropertyDropdown';
import {useProperty} from '../components/PropertyContext';

export default function WiFiDetailsScreen({ navigation, insets }) {
  const {width} = useWindowDimensions();
  const {units, selectedUnit, handleUnitChange} = useProperty();

  const fallbackProperties = [
    {unit_id: 'property-1', unit_name: 'Property 1'},
    {unit_id: 'property-2', unit_name: 'Property 2'},
    {unit_id: 'property-3', unit_name: 'Property 3'},
  ];

  // Temporary content until the property API provides this field.
  const wifiDetails = [
    {
      id: 'property-1',
      htmlContent: '<p>WiFi details for Property 1.</p>',
    },
    {id: 'property-2', htmlContent: '<p>WiFi details for Property 2.</p>'},
    {id: 'property-3', htmlContent: '<p>WiFi details for Property 3.</p>'},
  ];

  const propertyList = units.length ? units : fallbackProperties;
  const selectedProperty = selectedUnit || propertyList[0];
  const selectedIndex = Math.max(
    propertyList.findIndex(
      property => String(property.unit_id) === String(selectedProperty?.unit_id),
    ),
    0,
  );
  const wifiDetail = wifiDetails[selectedIndex % wifiDetails.length];

  const tagsStyles = {
    p: {
      color: '#495057',
      fontSize: 15,
      lineHeight: 22,
      margin: 0,
    },
    strong: {
      color: '#000000',
      fontWeight: 'bold',
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F7F4" translucent={false} />

      <View style={styles.container}>
        {/* Header Section */}
        <View style={[styles.header, {paddingTop: Math.max(insets?.top || 0, 16) + 8}]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation?.goBack?.()}
            style={styles.backButton}>
            <Text style={styles.backText}>{'‹'}</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>WiFi Details</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.propertySelectorWrap}>
          <PropertyDropdown
            selectedValue={selectedProperty?.unit_id}
            selectedLabel={selectedProperty?.unit_name}
            fallbackProperties={fallbackProperties}
            onChange={(_, property) => handleUnitChange(property)}
          />
        </View>

        {/* Main Content Area */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          
          <View style={styles.networkCard}>
              
              {/* Card Header (Title & Badge) */}
              <View style={styles.networkHeader}>
                <Text style={styles.networkName}>WiFi details</Text>
              </View>

              {/* Text Editor se aane wala Static HTML data display krne k liye wrap */}
              <View style={styles.editorContentWrap}>
                <RenderHtml
                  contentWidth={width - 64} // Card padding minus kari
                  source={{html: wifiDetail.htmlContent}}
                  tagsStyles={tagsStyles}
                />
              </View>

          </View>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F7F4' },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  backButton: { padding: 8 },
  backText: { fontSize: 28, color: '#000' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#000' },
  placeholder: { width: 40 },
  propertySelectorWrap: { paddingHorizontal: 16, marginTop: 16, zIndex: 10 },
  propertyLabel: { fontSize: 12, color: '#666', fontWeight: '600', marginBottom: 4 },
  propertySelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  propertyText: { fontSize: 16, color: '#000' },
  propertyChevron: { fontSize: 16, color: '#666' },
  dropdownMenu: { position: 'absolute', top: 60, left: 16, right: 16, backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', elevation: 4, zIndex: 50 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dropdownItemActive: { backgroundColor: '#F3F7F4' },
  dropdownItemText: { fontSize: 16, color: '#374151' },
  dropdownItemTextActive: { color: '#000', fontWeight: '600' },
  content: { padding: 16 },
  heroCard: { alignItems: 'center', backgroundColor: '#FFF', padding: 24, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  iconWrap: { backgroundColor: '#F3F7F4', padding: 16, borderRadius: 50, marginBottom: 12 },
  icon: { fontSize: 32 },
  heroTitle: { fontSize: 20, fontWeight: '700', color: '#000', marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: '#666' },
  
  // Custom Card and Editor UI Styles
  networkCard: { 
    backgroundColor: '#FFF', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: '#E5E7EB',
    elevation: 1,
  },
  networkHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6',
    paddingBottom: 10,
    marginBottom: 12
  },
  networkName: { fontSize: 13, fontWeight: '700', color: '#111827', letterSpacing: 0.5 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 6 },
  statusText: { fontSize: 12, color: '#047857', fontWeight: '500' },
  editorContentWrap: {
    paddingVertical: 4,
  }
});
