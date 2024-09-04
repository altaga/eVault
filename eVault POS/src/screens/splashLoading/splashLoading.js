// Basic Imports
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {Component} from 'react';
import {Dimensions, Image, View} from 'react-native';
import EncryptedStorage from 'react-native-encrypted-storage';
import logoSplash from '../../assets/logo.png';
import GlobalStyles from '../../styles/styles';
import ContextModule from '../../utils/contextModule';
import {getAsyncStorageValue} from '../../utils/utils';

const BasePublicKey =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

class SplashLoading extends Component {
  constructor(props) {
    super(props);
  }

  static contextType = ContextModule;

  async componentDidMount() {
    this.props.navigation.addListener('focus', async () => {
      // DEBUG ONLY
      //await this.erase();
      console.log(this.props.route.name);
      const publicKey = await getAsyncStorageValue('publicKey');
      if (publicKey) {
        const publicKeySavings = await getAsyncStorageValue('publicKeySavings');
        const publicKeyCard = await getAsyncStorageValue('publicKeyCard');
        this.context.setValue({
          publicKey: publicKey ?? BasePublicKey,
          publicKeySavings: publicKeySavings ?? BasePublicKey,
          publicKeyCard: publicKeyCard ?? BasePublicKey,
        });
        this.props.navigation.navigate('Main'); // Lock
      } else {
        this.props.navigation.navigate('Setup');
      }
    });
    this.props.navigation.addListener('blur', async () => {});
  }

  async erase() {
    // DEV ONLY - DON'T USE IN PRODUCTION
    try {
      await EncryptedStorage.clear();
      await AsyncStorage.clear();
    } catch (error) {
      console.log(error);
    }
  }

  render() {
    return (
      <View style={[GlobalStyles.container, {justifyContent: 'center'}]}>
        <Image
          resizeMode="contain"
          source={logoSplash}
          alt="Main Logo"
          style={{
            width: Dimensions.get('window').width,
          }}
        />
      </View>
    );
  }
}

export default SplashLoading;
