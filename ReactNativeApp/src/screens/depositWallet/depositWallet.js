import Clipboard from '@react-native-clipboard/clipboard';
import React, {Component} from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  Text,
  ToastAndroid,
  View,
} from 'react-native';
import QRCodeStyled from 'react-native-qrcode-styled';
import IconIonicons from 'react-native-vector-icons/Ionicons';
import Renders from '../../assets/logo.png';
import Title from '../../assets/title.png';
import GlobalStyles, {header, ratio} from '../../styles/styles';
import ContextModule from '../../utils/contextModule';
import {getAsyncStorageValue} from '../../utils/utils';
import {blockchain} from '../../utils/constants';
import Header from '../../components/header';

class DepositWallet extends Component {
  constructor(props) {
    super(props);
  }

  static contextType = ContextModule;

  render() {
    return (
      <View style={GlobalStyles.container}>
        <Header />
        <View
          style={[
            GlobalStyles.mainSend,
            {justifyContent: 'space-around', alignItems: 'center'},
          ]}>
          <Text style={GlobalStyles.exoTitle}>
            Receive {blockchain.network} {'\n'}or Coins
          </Text>
          <QRCodeStyled
            maxSize={Dimensions.get('screen').width * (ratio > 1.7 ? 0.8 : 0.5)}
            data={this.context.value.publicKey}
            style={[
              {
                backgroundColor: 'white',
                borderRadius: 10,
              },
            ]}
            errorCorrectionLevel="H"
            padding={16}
            //pieceSize={10}
            pieceBorderRadius={4}
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
                fontSize: 24,
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
      </View>
    );
  }
}

export default DepositWallet;
