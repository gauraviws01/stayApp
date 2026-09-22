import React, {useEffect, useMemo, useRef, useState} from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, {Path} from 'react-native-svg';
import PropertyDropdown from '../components/PropertyDropdown';
import PageHeader from '../components/PageHeader';

import {
  RichEditor,
  RichToolbar,
  actions,
} from 'react-native-pell-rich-editor';

/* =========================================================
   PROPERTY OPTIONS
========================================================= */

const propertyOptions = [
  'Sereno Greens - Cosy 1 BHK with Pvt Balcony',
  'Sereno Ikigai - 4BHK Villa with Pool',
  'Sereno Bloom - Penthouse Suite',
];

const INVENTORY_STORAGE_KEY = 'inventoryDetails';

const getDateKey = date => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CalendarIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path
      d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
      stroke="#287954"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);


/* =========================================================
   DATE FORMAT
========================================================= */

const formatDisplayDate = value => {
  const date = new Date(value);

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};


/* =========================================================
   CALENDAR DAYS
========================================================= */

const getCalendarDays = monthDate => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startWeekday = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const cells = [];

  for (let i = 0; i < startWeekday; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    cells.push(new Date(year, month, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
};


/* =========================================================
   SCREEN
========================================================= */

const InventoryDetailScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();

  const today = new Date();

  /* -------------------------------------------------------
     PROPERTY
  ------------------------------------------------------- */

  const [selectedProperty, setSelectedProperty] = useState(
    propertyOptions[0],
  );



  /* -------------------------------------------------------
     DATE
  ------------------------------------------------------- */

  const [selectedDate, setSelectedDate] = useState(new Date());

  const [calendarVisible, setCalendarVisible] = useState(false);

  const [calendarMonth, setCalendarMonth] = useState(
    new Date(
      today.getFullYear(),
      today.getMonth(),
      1,
    ),
  );


  /* -------------------------------------------------------
     RICH TEXT EDITOR
  ------------------------------------------------------- */

  const richText = useRef(null);

  const [inventoryHtml, setInventoryHtml] = useState();
  const [loadingInventory, setLoadingInventory] = useState(true);


  /* -------------------------------------------------------
     CALENDAR
  ------------------------------------------------------- */

  const monthDays = useMemo(
    () => getCalendarDays(calendarMonth),
    [calendarMonth],
  );


  const monthLabel = calendarMonth.toLocaleDateString(
    'en-US',
    {
      month: 'long',
      year: 'numeric',
    },
  );

  const todayKey = getDateKey(today);
  const selectedDateKey = getDateKey(selectedDate);
  const isPastDate = selectedDateKey < todayKey;
  const isFutureDate = selectedDateKey > todayKey;

  useEffect(() => {
    let mounted = true;

    const loadInventory = async () => {
      setLoadingInventory(true);

      try {
        const storedInventory = await AsyncStorage.getItem(INVENTORY_STORAGE_KEY);
        const inventory = storedInventory ? JSON.parse(storedInventory) : {};
        const key = `${selectedProperty}::${selectedDateKey}`;
        const html = inventory[key] || '';

        if (mounted) {
          setInventoryHtml(html);
          richText.current?.setContentHTML(html);
        }
      } catch (error) {
        if (mounted) {
          setInventoryHtml('');
          richText.current?.setContentHTML('');
        }
      } finally {
        if (mounted) {
          setLoadingInventory(false);
        }
      }
    };

    loadInventory();

    return () => {
      mounted = false;
    };
  }, [selectedProperty, selectedDateKey]);


  /* =========================================================
     DATE HANDLERS
  ========================================================= */

  const handleSelectDate = date => {
    if (getDateKey(date) > todayKey) {
      return;
    }

    setSelectedDate(
      new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      ),
    );

    setCalendarVisible(false);
  };


  const changeMonth = step => {
    const nextMonth = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth() + step,
      1,
    );

    if (
      nextMonth.getFullYear() > today.getFullYear() ||
      (nextMonth.getFullYear() === today.getFullYear() &&
        nextMonth.getMonth() > today.getMonth())
    ) {
      return;
    }

    setCalendarMonth(
      nextMonth,
    );
  };


  /* =========================================================
     SAVE
  ========================================================= */

  const handleSaveInventory = async () => {
    if (isPastDate || isFutureDate || loadingInventory) {
      return;
    }

    try {
      const storedInventory = await AsyncStorage.getItem(INVENTORY_STORAGE_KEY);
      const inventory = storedInventory ? JSON.parse(storedInventory) : {};
      const key = `${selectedProperty}::${selectedDateKey}`;

      inventory[key] = inventoryHtml || '';
      await AsyncStorage.setItem(
        INVENTORY_STORAGE_KEY,
        JSON.stringify(inventory),
      );
      richText.current?.blurContentEditor?.();
    } catch (error) {
      console.log('SAVE INVENTORY ERROR:', error);
    }

    console.log('====================================');
    console.log('PROPERTY:', selectedProperty);
    console.log('DATE:', selectedDate);
    console.log('INVENTORY HTML:', inventoryHtml);
    console.log('====================================');

    /*
      Yahan API call laga sakte ho.

      Example:

      const payload = {
        property: selectedProperty,
        date: selectedDate,
        inventory_details: inventoryHtml,
      };
    */
  };


  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <SafeAreaView style={styles.safeArea}>

      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F3F7F4"
        translucent={false}
      />


      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }>


        {/* =================================================
            HEADER
        ================================================= */}

        <PageHeader navigation={navigation} title="Inventory" />


        {/* =================================================
            SCROLL CONTENT
        ================================================= */}

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom:
                insets.bottom + 30,
            },
          ]}>


          {/* =================================================
              PROPERTY
          ================================================= */}

          <View style={styles.propertySelectorWrap}>
            <PropertyDropdown
              selectedValue={selectedProperty}
              selectedLabel={selectedProperty}
              fallbackProperties={propertyOptions}
              onChange={property => setSelectedProperty(property)}
            />
          </View>


          {/* =================================================
              DATE SELECTOR
          ================================================= */}

            <Text style={styles.dateLabel}>DATE</Text>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.dateInput}
            onPress={() => setCalendarVisible(true)}>
            <Text style={styles.dateInputText}>{formatDisplayDate(selectedDate)}</Text>
            <CalendarIcon />
          </TouchableOpacity>


          <View style={styles.detailSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconWrap}>
                <Text style={styles.sectionIcon}>📝</Text>
              </View>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Inventory details</Text>
                <Text style={styles.sectionSubtitle}>Add notes and inventory information</Text>
              </View>
            </View>

            <View style={styles.richEditorWrapper}>

              <RichToolbar
                editor={richText}
                actions={[
                  actions.undo,
                  actions.redo,
                  actions.setBold,
                  actions.setItalic,
                  actions.setUnderline,
                  actions.insertBulletsList,
                  actions.insertOrderedList,
                  actions.alignLeft,
                  actions.alignCenter,
                  actions.alignRight,
                ]}
                iconTint="#355C50"
                selectedIconTint="#17B978"
                disabledIconTint="#AAB8B3"
                disabled={isPastDate || isFutureDate || loadingInventory}
                style={styles.richToolbar}
                flatContainerStyle={
                  styles.richToolbarContainer
                }
              />


              <RichEditor
                ref={richText}
                initialContentHTML={inventoryHtml || ''}
                disabled={isPastDate || isFutureDate || loadingInventory}
                onChange={html => {
                  setInventoryHtml(html);
                }}
                placeholder="Write inventory details here..."
                useContainer={true}
                initialHeight={190}
                style={styles.richEditor}
                editorStyle={{
                  backgroundColor:
                    '#FFFFFF',

                  color: '#1F2D2A',

                  placeholderColor:
                    '#7F918B',

                  contentCSSText: `
                    font-size: 15px;
                    line-height: 24px;
                    padding: 8px;
                    font-family: Arial;
                  `,
                }}
              />

            </View>


            <View style={styles.formatInfo}>
              <View style={styles.formatInfoIcon}>
                <Text style={styles.formatInfoIconText}>i</Text>
              </View>
              <Text style={styles.formatInfoText}>Select any text and use the toolbar to format it.</Text>
            </View>
          </View>


          {/* =================================================
              SAVE BUTTON
          ================================================= */}

          {!isPastDate && !isFutureDate && !loadingInventory && (
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.submitButton}
            onPress={handleSaveInventory}>

            <Text
              style={styles.submitButtonText}>

              Save

            </Text>

          </TouchableOpacity>
          )}


        </ScrollView>

      </KeyboardAvoidingView>


      {/* =====================================================
          CALENDAR MODAL
      ===================================================== */}

      <Modal
        visible={calendarVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setCalendarVisible(false)
        }>

        <View style={styles.modalOverlay}>

          <View style={styles.calendarModal}>


            {/* MODAL HEADER */}

            <View style={styles.modalHeader}>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  changeMonth(-1)
                }
                style={styles.monthNav}>

                <Text
                  style={styles.monthNavText}>
                  {'‹'}
                </Text>

              </TouchableOpacity>


              <Text
                style={styles.modalMonthLabel}>

                {monthLabel}

              </Text>


              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  changeMonth(1)
                }
                style={styles.monthNav}>

                <Text
                  style={styles.monthNavText}>
                  {'›'}
                </Text>

              </TouchableOpacity>

            </View>


            {/* WEEK DAYS */}

            <View style={styles.weekRow}>

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
                  style={styles.weekLabel}>

                  {day}

                </Text>

              ))}

            </View>


            {/* CALENDAR */}

            <View style={styles.calendarGrid}>

              {monthDays.map(
                (day, index) => {

                  if (!day) {

                    return (
                      <View
                        key={`empty-${index}`}
                        style={
                          styles.dayCellEmpty
                        }
                      />
                    );

                  }


                  const isSelected =
                    day.getFullYear() ===
                      selectedDate.getFullYear() &&
                    day.getMonth() ===
                      selectedDate.getMonth() &&
                    day.getDate() ===
                      selectedDate.getDate();


                  const isCurrentMonth =
                    day.getMonth() ===
                    calendarMonth.getMonth();


                  return (

                    <TouchableOpacity
                      key={day.toISOString()}
                      activeOpacity={0.8}
                      disabled={getDateKey(day) > todayKey}
                      onPress={() =>
                        handleSelectDate(
                          day,
                        )
                      }
                      style={[
                        styles.dayCell,
                        getDateKey(day) > todayKey && styles.dayCellDisabled,
                        isSelected &&
                          styles.dayCellSelected,
                      ]}>

                      <Text
                        style={[
                          styles.dayText,

                          !isCurrentMonth &&
                            styles.dayTextMuted,

                          getDateKey(day) > todayKey &&
                            styles.dayTextDisabled,

                          isSelected &&
                            styles.dayTextSelected,
                        ]}>

                        {day.getDate()}

                      </Text>

                    </TouchableOpacity>

                  );

                },
              )}

            </View>


            {/* DONE */}

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.doneButton}
              onPress={() =>
                setCalendarVisible(false)
              }>

              <Text
                style={styles.doneButtonText}>

                Done

              </Text>

            </TouchableOpacity>

          </View>

        </View>

      </Modal>

    </SafeAreaView>
  );
};


/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({

  /* =======================================================
     MAIN
  ======================================================= */

  safeArea: {
    flex: 1,
    backgroundColor: '#F3F7F4',
  },


  container: {
    flex: 1,
    backgroundColor: '#F3F7F4',
  },


  scrollContent: {
    paddingHorizontal: 18,
  },


  /* =======================================================
     HEADER
  ======================================================= */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
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


  /* =======================================================
     PROPERTY
  ======================================================= */

  propertySelectorWrap: {
    marginBottom: 16,
    zIndex: 10,
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
    backgroundColor: '#F4F9F5',
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
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
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


  /* =======================================================
     DATE
  ======================================================= */

  dateInput: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E5DE',
    borderRadius: 13,
    paddingHorizontal: 16,
    marginBottom: 20,
  },


  dateLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#849890',
    marginBottom: 8,
  },


  dateInputText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#173A30',
  },


  /* =======================================================
     DETAIL SECTION
  ======================================================= */

  detailSection: {
    backgroundColor: '#F4F9F5',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D8EAE2',
    padding: 16,
    marginBottom: 18,
  },


  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },


  sectionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EAF7F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },


  sectionIcon: {
    fontSize: 17,
  },


  sectionHeaderText: {
    flex: 1,
  },


  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2D2A',
  },


  sectionSubtitle: {
    fontSize: 11,
    color: '#78918A',
    marginTop: 3,
  },


  /* =======================================================
     RICH TEXT EDITOR
  ======================================================= */

  richEditorWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#D7E5DF',
    overflow: 'hidden',
  },


  richToolbar: {
    backgroundColor: '#EAF5F0',
    borderBottomWidth: 1,
    borderBottomColor: '#D7E5DF',
    minHeight: 48,
  },


  richToolbarContainer: {
    paddingHorizontal: 4,
  },


  richEditor: {
    minHeight: 190,
    backgroundColor: '#FFFFFF',
  },


  /* =======================================================
     INFO
  ======================================================= */

  formatInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 2,
  },


  formatInfoIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DDF4EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },


  formatInfoIconText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16875F',
  },


  formatInfoText: {
    flex: 1,
    fontSize: 11,
    color: '#78918A',
  },


  /* =======================================================
     SAVE
  ======================================================= */

  submitButton: {
    backgroundColor: '#17B978',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,

    elevation: 3,

    shadowColor: '#17B978',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },


  submitButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },


  /* =======================================================
     MODAL
  ======================================================= */

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.32)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },


  calendarModal: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
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


  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },


  monthNav: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EAF7F3',
    alignItems: 'center',
    justifyContent: 'center',
  },


  monthNavText: {
    fontSize: 22,
    color: '#113B32',
    fontWeight: '700',
  },


  modalMonthLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2D2A',
  },


  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },


  weekLabel: {
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


  dayCell: {
    width: '14.285%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 10,
  },


  dayCellSelected: {
    backgroundColor: '#17B978',
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


  dayTextMuted: {
    color: '#A0AAA7',
  },


  dayTextSelected: {
    color: '#FFFFFF',
  },


  dayTextDisabled: {
    color: '#A0AAA7',
  },


  doneButton: {
    marginTop: 14,
    backgroundColor: '#EAF7F3',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },


  doneButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#114433',
  },

});


export default InventoryDetailScreen;