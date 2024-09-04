import {Aptos} from '@aptos-labs/ts-sdk';
import {ethers} from 'ethers';
import React, {Component} from 'react';
import {Pressable, RefreshControl, ScrollView, Text, View} from 'react-native';
import IconIonicons from 'react-native-vector-icons/Ionicons';
import GlobalStyles, {mainColor} from '../../../styles/styles';
import {blockchain, refreshTime} from '../../../utils/constants';
import ContextModule from '../../../utils/contextModule';
import {
  arraySum,
  epsilonRound,
  getAsyncStorageValue,
  setAsyncStorageValue,
} from '../../../utils/utils';
import LinearGradient from 'react-native-linear-gradient';

const baseTab1State = {
  refreshing: false,
  publicKey:
    '0x0000000000000000000000000000000000000000000000000000000000000000',
  balances: blockchain.tokens.map(() => 0),
  usdConversion: blockchain.tokens.map(() => 1),
  activeTokens: blockchain.tokens.map(() => true), // to do later
  nfcSupported: true,
};

class Tab1 extends Component {
  constructor(props) {
    super(props);
    this.state = baseTab1State;
    this.provider = new ethers.providers.JsonRpcProvider(blockchain.rpc);
    this.controller = new AbortController();
    this.aptos = new Aptos(blockchain.aptosConfig);
  }
  static contextType = ContextModule;

  async componentDidMount() {
    const balances = await getAsyncStorageValue('balances');
    const usdConversion = await getAsyncStorageValue('usdConversion');
    const activeTokens = await getAsyncStorageValue('activeTokens');
    console.log(this.context.value.publicKey);
    await this.setStateAsync({
      balances: balances ?? baseTab1State.balances,
      usdConversion: usdConversion ?? baseTab1State.usdConversion,
      activeTokens: activeTokens ?? baseTab1State.activeTokens,
    });
    const refreshCheck = Date.now();
    const lastRefresh = await this.getLastRefresh();
    if (refreshCheck - lastRefresh >= refreshTime) {
      // 2.5 minutes
      await setAsyncStorageValue({lastRefresh: Date.now().toString()});
      this.refresh();
    } else {
      console.log(
        `Next refresh Available: ${Math.round(
          (refreshTime - (refreshCheck - lastRefresh)) / 1000,
        )} Seconds`,
      );
    }
  }

  async setStateAsync(value) {
    return new Promise(resolve => {
      this.setState(
        {
          ...value,
        },
        () => resolve(),
      );
    });
  }

  async refresh() {
    await this.setStateAsync({refreshing: true});
    await Promise.all([this.getUSD(), this.getBalances()]);
    await this.setStateAsync({refreshing: false});
  }

  // Get Balances

  async getBalances() {
    const {publicKey} = this.context.value;
    const balancesTemp = await Promise.all(
      blockchain.tokens.map(token =>
        this.aptos.getAccountCoinAmount({
          accountAddress: publicKey,
          coinType: token.address,
        }),
      ),
    );
    const balances = blockchain.tokens.map((token, index) =>
      ethers.utils.formatUnits(balancesTemp[index], token.decimals),
    );
    console.log(balances);
    await setAsyncStorageValue({balances});
    await this.setState({balances});
  }

  // USD Conversions

  async getUSD() {
    const array = blockchain.tokens.map(token => token.coingecko);
    var myHeaders = new Headers();
    myHeaders.append('accept', 'application/json');
    var requestOptions = {
      signal: this.controller.signal,
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
    };
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${array.toString()}&vs_currencies=usd`,
      requestOptions,
    );
    const result = await response.json();
    const usdConversion = array.map(x => result[x].usd);
    setAsyncStorageValue({usdConversion});
    this.setState({usdConversion});
  }

  async getLastRefresh() {
    try {
      const lastRefresh = await getAsyncStorageValue('lastRefresh');
      if (lastRefresh === null) throw 'Set First Date';
      return lastRefresh;
    } catch (err) {
      await setAsyncStorageValue({lastRefresh: '0'.toString()});
      return 0;
    }
  }

  render() {
    const iconSize = 38;
    return (
      <View
        style={{
          width: '100%',
          height: '100%',
        }}>
        <View style={GlobalStyles.balanceContainer}>
          <LinearGradient
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
            }}
            colors={['#000000', '#1a1a1a', '#000000']}>
            <Text style={GlobalStyles.title}>Account Balance</Text>
            <Text style={[GlobalStyles.balance]}>
              {`$ ${epsilonRound(
                arraySum(
                  this.state.balances.map(
                    (x, i) => x * this.state.usdConversion[i],
                  ),
                ),
                2,
              )} USD`}
            </Text>
          </LinearGradient>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-evenly',
              alignItems: 'center',
              width: '100%',
            }}>
            <View style={{justifyContent: 'center', alignItems: 'center'}}>
              <Pressable
                onPress={() => this.props.navigation.navigate('SendWallet')}
                style={GlobalStyles.singleButton}>
                <IconIonicons
                  name="arrow-up-outline"
                  size={iconSize}
                  color={'white'}
                />
              </Pressable>
              <Text style={GlobalStyles.singleButtonText}>Send</Text>
            </View>
            <View style={{justifyContent: 'center', alignItems: 'center'}}>
              <Pressable
                onPress={() => this.props.navigation.navigate('DepositWallet')}
                style={GlobalStyles.singleButton}>
                <IconIonicons
                  name="arrow-down-outline"
                  size={iconSize}
                  color={'white'}
                />
              </Pressable>
              <Text style={GlobalStyles.singleButtonText}>Receive</Text>
            </View>
            {this.state.nfcSupported && (
              <View style={{justifyContent: 'center', alignItems: 'center'}}>
                <Pressable
                  onPress={() =>
                    this.props.navigation.navigate('PaymentWallet')
                  }
                  style={GlobalStyles.singleButton}>
                  <IconIonicons name="card" size={iconSize} color={'white'} />
                </Pressable>
                <Text style={GlobalStyles.singleButtonText}>{'Payment'}</Text>
              </View>
            )}
          </View>
        </View>
        <ScrollView
          refreshControl={
            <RefreshControl
              progressBackgroundColor={mainColor}
              refreshing={this.state.refreshing}
              onRefresh={async () => {
                await setAsyncStorageValue({
                  lastRefresh: Date.now().toString(),
                });
                await this.refresh();
              }}
            />
          }
          showsVerticalScrollIndicator={false}
          style={GlobalStyles.tokensContainer}
          contentContainerStyle={{
            justifyContent: 'flex-start',
            alignItems: 'center',
          }}>
          {blockchain.tokens.map((token, index) =>
            this.state.activeTokens[index] ? (
              <View key={index} style={GlobalStyles.network}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    paddingHorizontal: 15,
                  }}>
                  <View style={{width: 'auto', flexDirection: 'row'}}>
                    {token.icon}
                    <View style={{paddingLeft: 15}}>
                      <Text style={{fontSize: 18, color: 'white'}}>
                        {token.name}
                      </Text>
                      <Text style={{fontSize: 12, color: 'white'}}>
                        {this.state.balances[index] === 0
                          ? '0'
                          : this.state.balances[index] < 0.001
                          ? '<0.01'
                          : epsilonRound(this.state.balances[index], 2)}{' '}
                        {token.symbol}
                        {`  -  ($${epsilonRound(
                          this.state.usdConversion[index],
                          2,
                        )} USD)`}
                      </Text>
                    </View>
                  </View>
                  <Text style={{color: 'white', alignSelf: 'center'}}>
                    $
                    {epsilonRound(
                      this.state.balances[index] *
                        this.state.usdConversion[index],
                      2,
                    )}{' '}
                    USD
                  </Text>
                </View>
              </View>
            ) : (
              <React.Fragment key={index} />
            ),
          )}
        </ScrollView>
      </View>
    );
  }
}

export default Tab1;
