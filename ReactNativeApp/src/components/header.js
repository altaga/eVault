import {Image, Text, View} from 'react-native';
import React, {Component} from 'react';
import GlobalStyles, { header } from '../styles/styles';
import Renders from '../assets/logo.png';
import Title from '../assets/title.png';

export default class Header extends Component {
  render() {
    const headerTitleSize = 2.5;
    const headerIconSize = 4;
    return (
      <View
        style={[
          GlobalStyles.headerMain,
          {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignContent: 'center',
          },
        ]}>
        <View style={GlobalStyles.headerItem}>
          <Image
            source={Renders}
            alt="Logo"
            style={{
              width: 192 / headerIconSize,
              height: 192 / headerIconSize,
              alignSelf: 'flex-start',
              marginLeft: 20,
            }}
          />
        </View>
        <View style={GlobalStyles.headerItem}>
          <Image
            source={Title}
            alt="Logo"
            style={{
              width: 559 * (header / (120 * headerTitleSize)),
              height: 124 * (header / (120 * headerTitleSize)),
            }}
          />
        </View>
      </View>
    );
  }
}
