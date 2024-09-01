import {Dimensions, StatusBar, StyleSheet} from 'react-native';

export const screenHeight = Dimensions.get('screen').height;
export const windowHeight = Dimensions.get('window').height;

export const mainColor = '#00bc8e';
export const secondaryColor = '#c154d3';
export const tertiaryColor = '#f8930d';
export const quaternaryColor = '#0566eb';
export const backgroundColor = '#000000';

export const header = 70;
export const footer = 60;
export const main = Dimensions.get('window').height - (header + footer);
export const ratio =
  Dimensions.get('window').height / Dimensions.get('window').width;
export const StatusBarHeight = StatusBar.currentHeight;
export const NavigatorBarHeight = screenHeight - windowHeight;
export const iconSize = Math.round(footer / 2.6);
const GlobalStyles = StyleSheet.create({
  // Globals Layout
  container: {
    flex: 1,
    width: Dimensions.get('window').width,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor,
  },
  header: {
    height: header,
    width: Dimensions.get('window').width,
  },
  main: {
    height: main,
    width: Dimensions.get('window').width,
    marginTop: header,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainFull: {
    height: main + footer,
    width: Dimensions.get('window').width,
    marginTop: header,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footer: {
    width: Dimensions.get('window').width,
    height: footer,
  },
  // General text
  balance: {
    fontSize: 38,
    color: 'white',
    marginTop: 10,
  },
  title: {
    fontSize: ratio > 1.7 ? 32 : 26,
    color: '#fff',
    textAlign: 'center',
    fontFamily: 'Exo2-Bold',
  },
  description: {
    fontWeight: 'bold',
    fontSize: ratio > 1.7 ? 18 : 14,
    textAlign: 'center',
    color: '#ffffff',
  },
  formTitle: {
    color: 'white',
    textAlign: 'left',
    textAlignVertical: 'center',
    fontFamily: 'Exo2-Bold',
    fontSize: 18,
  },
  formTitleCard: {
    color: 'white',
    textAlign: 'left',
    textAlignVertical: 'center',
    fontFamily: 'Exo2-Bold',
    fontSize: 24,
  },
  exoTitle: {
    color: 'white',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontFamily: 'Exo2-Bold',
    fontSize: 24,
  },
  // Globals Buttons
  buttonContainer: {
    gap: 4,
  },
  buttonStyle: {
    backgroundColor: mainColor,
    borderRadius: 50,
    padding: 10,
    width: Dimensions.get('window').width * 0.9,
    alignItems: 'center',
    borderColor: mainColor,
    borderWidth: 2,
  },
  buttonCancelStyle: {
    backgroundColor: 'black',
    borderRadius: 50,
    padding: 10,
    width: Dimensions.get('window').width * 0.9,
    alignItems: 'center',
    borderColor: 'black',
    borderWidth: 2,
    borderColor: 'gray',
  },
  buttonStyleOutline: {
    backgroundColor: '#1E2423',
    borderRadius: 50,
    borderWidth: 2,
    padding: 10,
    width: Dimensions.get('window').width * 0.9,
    alignItems: 'center',
    borderColor: '#aaaaaa',
  },
  buttonStyleDot: {
    backgroundColor: "black",
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'white',
    borderWidth: 2,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 24,
    fontFamily: 'Exo2-Bold',
  },
  buttonCancelText: {
    color: 'gray',
    fontSize: 24,
    fontFamily: 'Exo2-Bold',
  },
  buttonLogoutStyle: {
    backgroundColor: mainColor,
    borderRadius: 50,
    padding: 10,
    width: Dimensions.get('window').width * 0.2,
    alignItems: 'center',
    borderColor: 'black',
    borderWidth: 2,
  },
  singleButton: {
    backgroundColor: mainColor,
    borderRadius: 50,
    width: ratio > 1.7 ? 60 : 50,
    height: ratio > 1.7 ? 60 : 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  singleButtonText: {
    color: 'white',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontFamily: 'Exo2-Regular',
  },
  buttonSelectorSelectedStyle: {
    backgroundColor: '#1E2423',
    borderWidth: 2,
    padding: 5,
    width: Dimensions.get('window').width * 0.45,
    alignItems: 'center',
    borderColor: mainColor,
  },
  buttonSelectorStyle: {
    backgroundColor: '#1E2423',
    borderWidth: 2,
    padding: 5,
    width: Dimensions.get('window').width * 0.45,
    alignItems: 'center',
    borderColor: '#aaaaaa',
  },
  // Selectors
  selector: {
    width: Dimensions.get('window').width * 0.3333,
    height: 'auto',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorText: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    fontFamily: 'Exo2-Regular',
  },
  selectorSelectedText: {
    fontSize: 14,
    color: mainColor,
    textAlign: 'center',
    fontFamily: 'Exo2-Regular',
  },
  // Main Modifiers
  headerMain: {
    height: header,
    width: Dimensions.get('window').width,
    borderBottomWidth: 0,
    borderBottomColor: mainColor,
    position: 'absolute',
    top: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerItem: {
    width: Dimensions.get('window').width / 2,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextButton: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Exo2-Bold',
  },
  footerMain: {
    width: Dimensions.get('window').width,
    height: footer,
    flexDirection: 'row',
    borderTopWidth: 0,
    borderTopColor: mainColor,
  },
  balanceContainer: {
    display: 'flex',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    height: ratio > 1.7 ? main * 0.4 : main * 0.45,
  },
  tokensContainer: {
    height: ratio > 1.7 ? main * 0.6 : main * 0.55,
    marginBottom: 0,
  },
  // Tab 2
  tab2Container: {
    width: '100%',
    height: '100%',
  },
  tab2ScrollContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
  },
  // Tab 3
  tab3Container: {
    width: '100%',
    height: '100%',
  },
  tab3ScrollContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  // Networks
  networkShow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: '90%',
    height: 60,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    marginVertical: 10,
  },
  network: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
    height: 60,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    marginVertical: 10,
  },
  // Send Styles
  input: {
    borderRadius: 5,
    width: '90%',
    borderColor: secondaryColor,
    borderWidth: 2,
    color: 'black',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignContent: 'center',
    alignSelf: 'center',
    textAlign: 'center',
    fontSize: 24,
    height: 50,
    marginBottom: 20,
    marginTop: 20,
  },
  // Modal
  singleModalButton: {
    backgroundColor: mainColor,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  singleModalButtonText: {
    fontSize: 24,
    color: 'white',
    marginVertical: 10,
  },
  // Savings Styles
  titleSaves: {
    fontSize: 18,
    color: '#fff',
    textAlignVertical: 'center',
    fontFamily: 'Exo2-Bold',
  },
});

export default GlobalStyles;
