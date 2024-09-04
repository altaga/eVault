import Clipboard from '@react-native-clipboard/clipboard';
import React, {Component} from 'react';
import {
  Dimensions,
  Pressable,
  SafeAreaView,
  Text,
  ToastAndroid,
  View,
} from 'react-native';
import QRCodeStyled from 'react-native-qrcode-styled';
import IconIonicons from 'react-native-vector-icons/Ionicons';
import Header from '../../components/header';
import GlobalStyles, {ratio} from '../../styles/styles';
import {blockchain} from '../../utils/constants';
import ContextModule from '../../utils/contextModule';

class DepositWallet extends Component {
  constructor(props) {
    super(props);
  }

  static contextType = ContextModule;

  render() {
    return (
      <SafeAreaView style={[GlobalStyles.container]}>
        <Header />
        <View
          style={[
            GlobalStyles.mainFull,
            {
              justifyContent: 'space-between',
              alignItems: 'center',
              marginVertical: 10,
            },
          ]}>
          <Text style={GlobalStyles.exoTitle}>
            Receive {blockchain.token} {'\n'}or Coins
          </Text>
          <QRCodeStyled
            maxSize={Dimensions.get('screen').width * 0.75}
            data={this.context.value.publicKey}
            style={[
              {
                backgroundColor: 'white',
                borderRadius: 10,
              },
            ]}
            errorCorrectionLevel="H"
            padding={16}
            pieceBorderRadius={3}
            isPiecesGlued
            color={'black'}
          />
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: 'white',
                textAlign: 'center',
                width: '85%',
              }}>
              {this.context.value.publicKey.substring(
                Math.floor((this.context.value.publicKey.length * 0) / 3),
                Math.floor((this.context.value.publicKey.length * 1) / 3),
              ) +
                '\n' +
                this.context.value.publicKey.substring(
                  Math.floor((this.context.value.publicKey.length * 1) / 3),
                  Math.floor((this.context.value.publicKey.length * 2) / 3),
                ) +
                '\n' +
                this.context.value.publicKey.substring(
                  Math.floor((this.context.value.publicKey.length * 2) / 3),
                  Math.floor((this.context.value.publicKey.length * 3) / 3),
                )}
            </Text>
            <Pressable
              onPress={() => {
                Clipboard.setString(this.context.value.publicKey);
                ToastAndroid.show(
                  'Address copied to clipboard',
                  ToastAndroid.LONG,
                );
              }}
              style={{
                width: '15%',
                alignItems: 'flex-start',
              }}>
              <IconIonicons name="copy" size={30} color={'white'} />
            </Pressable>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              width: '100%',
            }}>
            <Pressable
              style={[GlobalStyles.buttonStyle]}
              onPress={() => this.props.navigation.goBack()}>
              <Text style={[GlobalStyles.buttonText]}>Return</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }
}

export default DepositWallet;
