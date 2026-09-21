import React, { useState } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  View, 
  Text, 
  TouchableOpacity, 
  StatusBar, 
  SafeAreaView, 
  useWindowDimensions // <-- HTML size adjust karne ke liye import kiya
} from 'react-native';
import RenderHtml from 'react-native-render-html'; // <-- Renderer import kiya

export default function WiFiDetailsScreen({ navigation, insets }) {
  const { width } = useWindowDimensions(); // Screen width li
  const [isPropertyOpen, setIsPropertyOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState('Property 1');
  const propertyOptions = ['Property 1', 'Property 2', 'Property 3'];

  // 1. Static list jisme aapka text editor ka HTML content stored hai
  const wifiList = [
    {
      id: '1',
      title: "INTERNAL WIFI/ELECTRICITY ACCOUNT DETAILS",
      htmlContent: "<p>Hello --- n sjknjkdns</p>",
    },
     {
      id: '2',
      title: "INTERNAL WIFI/ELECTRICITY ACCOUNT DETAILS",
      htmlContent: "<p>Hello --- n sjknjkdns</p>",
    },
  ];

  // HTML content ke tags ko style karne ke liye (Optional)
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

        {/* Property Selector */}
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

        {/* Main Content Area */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          
          {/* Hero Banner Card */}
          <View style={styles.heroCard}>
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>📶</Text>
            </View>
            <Text style={styles.heroTitle}>Property WiFi</Text>
            <Text style={styles.heroSubtitle}>Access points & passwords</Text>
          </View>

          {/* STATIC HTML CARDS MAPPING */}
          {wifiList.map(item => (
            <View key={item.id} style={styles.networkCard}>
              
              {/* Card Header (Title & Badge) */}
              <View style={styles.networkHeader}>
                <Text style={styles.networkName}>{item.title}</Text>
                
              </View>

              {/* Text Editor se aane wala Static HTML data display krne k liye wrap */}
              <View style={styles.editorContentWrap}>
                <RenderHtml
                  contentWidth={width - 64} // Card padding minus kari
                  source={{ html: item.htmlContent }}
                  tagsStyles={tagsStyles}
                />
              </View>

            </View>
          ))}

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
