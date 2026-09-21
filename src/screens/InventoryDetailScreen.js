import React, {useMemo, useRef, useState} from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {
  RichEditor,
  RichToolbar,
  actions,
} from 'react-native-pell-rich-editor';

const {width, height} = Dimensions.get('window');

const wp = value => (width * value) / 100;
const hp = value => (height * value) / 100;


/* =========================================================
   PROPERTY OPTIONS
========================================================= */

const propertyOptions = [
  'Sereno Greens - Cosy 1 BHK with Pvt Balcony',
  'Sereno Ikigai - 4BHK Villa with Pool',
  'Sereno Bloom - Penthouse Suite',
];


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

  const [isPropertyOpen, setIsPropertyOpen] = useState(false);


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


  /* =========================================================
     DATE HANDLERS
  ========================================================= */

  const handleSelectDate = date => {
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
    setCalendarMonth(
      new Date(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth() + step,
        1,
      ),
    );
  };


  /* =========================================================
     SAVE
  ========================================================= */

  const handleSaveInventory = () => {
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

        <View
          style={[
            styles.header,
            {
              paddingTop:
                Math.max(insets.top, 16) + 8,
            },
          ]}>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              navigation?.goBack?.()
            }
            style={styles.backButton}>

            <Text style={styles.backText}>
              {'‹'}
            </Text>

          </TouchableOpacity>


          <Text style={styles.headerTitle}>
            Inventory
          </Text>


          <View style={styles.placeholder} />

        </View>


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

            <Text style={styles.propertyLabel}>
              PROPERTY
            </Text>


            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.propertySelector}
              onPress={() =>
                setIsPropertyOpen(
                  !isPropertyOpen,
                )
              }>

              <Text
                style={styles.propertyText}
                numberOfLines={1}>

                {selectedProperty}

              </Text>


              <Text
                style={styles.propertyChevron}>

                {isPropertyOpen
                  ? '⌃'
                  : '⌄'}

              </Text>

            </TouchableOpacity>


            {/* DROPDOWN */}

            {isPropertyOpen && (
              <View
                style={styles.dropdownMenu}>

                {propertyOptions.map(
                  option => (

                    <TouchableOpacity
                      key={option}
                      activeOpacity={0.8}
                      style={[
                        styles.dropdownItem,
                        selectedProperty ===
                          option &&
                          styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        setSelectedProperty(
                          option,
                        );

                        setIsPropertyOpen(
                          false,
                        );
                      }}>

                      <Text
                        style={[
                          styles.dropdownItemText,
                          selectedProperty ===
                            option &&
                            styles.dropdownItemTextActive,
                        ]}>

                        {option}

                      </Text>

                    </TouchableOpacity>

                  ),
                )}

              </View>
            )}

          </View>


          {/* =================================================
              DATE SELECTOR
          ================================================= */}

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.dateSelector}
            onPress={() =>
              setCalendarVisible(true)
            }>

            <View style={styles.dateLeftWrap}>

              <View style={styles.dateIconBox}>

                <Text style={styles.dateIcon}>
                  🗓
                </Text>

              </View>


              <View style={styles.dateTextWrap}>

                <Text style={styles.dateLabel}>
                  CHOOSE A DATE
                </Text>

                <Text style={styles.dateValue}>
                  {formatDisplayDate(
                    selectedDate,
                  )}
                </Text>

              </View>

            </View>


            <Text style={styles.dateChevron}>
              {'›'}
            </Text>

          </TouchableOpacity>


          {/* =================================================
              INVENTORY DETAILS
          ================================================= */}

          <View style={styles.detailSection}>


            {/* SECTION HEADER */}

            <View style={styles.sectionHeader}>

              <View
                style={styles.sectionIconWrap}>

                <Text style={styles.sectionIcon}>
                  📝
                </Text>

              </View>


              <View style={styles.sectionHeaderText}>

                <Text style={styles.sectionTitle}>
                  Inventory details
                </Text>

                <Text
                  style={styles.sectionSubtitle}>

                  Add notes and inventory
                  information

                </Text>

              </View>

            </View>


            {/* =================================================
                RICH TEXT TOOLBAR + EDITOR
            ================================================= */}

            <View
              style={styles.richEditorWrapper}>


              {/* TOOLBAR */}

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
                style={styles.richToolbar}
                flatContainerStyle={
                  styles.richToolbarContainer
                }
              />


              {/* EDITOR */}

              <RichEditor
                ref={richText}
                initialContentHTML={inventoryHtml}
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


            {/* =================================================
                FORMAT INFO
            ================================================= */}

            <View
              style={styles.formatInfo}>

              <View
                style={styles.formatInfoIcon}>

                <Text
                  style={
                    styles.formatInfoIconText
                  }>
                  i
                </Text>

              </View>


              <Text
                style={styles.formatInfoText}>

                Select any text and use the
                toolbar to format it.

              </Text>

            </View>

          </View>


          {/* =================================================
              SAVE BUTTON
          ================================================= */}

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.submitButton}
            onPress={handleSaveInventory}>

            <Text
              style={styles.submitButtonText}>

              Save inventory

            </Text>

          </TouchableOpacity>


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
                      onPress={() =>
                        handleSelectDate(
                          day,
                        )
                      }
                      style={[
                        styles.dayCell,
                        isSelected &&
                          styles.dayCellSelected,
                      ]}>

                      <Text
                        style={[
                          styles.dayText,

                          !isCurrentMonth &&
                            styles.dayTextMuted,

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

  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F4F9F5',
    borderWidth: 1,
    borderColor: '#D8EAE2',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 20,
  },


  dateLeftWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },


  dateIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EAF7F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },


  dateIcon: {
    fontSize: 18,
  },


  dateTextWrap: {
    flex: 1,
  },


  dateLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: '#5F7D72',
    textTransform: 'uppercase',
    marginBottom: 2,
  },


  dateValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2D2A',
  },


  dateChevron: {
    fontSize: 24,
    color: '#1F2D2A',
    marginLeft: 8,
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