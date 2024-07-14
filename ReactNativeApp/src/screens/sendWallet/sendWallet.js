import {
  Account,
  Aptos,
  Ed25519PrivateKey,
  TransactionWorkerEventsEnum,
} from '@aptos-labs/ts-sdk';
import {ethers} from 'ethers';
import React, {Component, Fragment} from 'react';
import {
  Dimensions,
  Image,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  ToastAndroid,
  View,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import IconIonIcons from 'react-native-vector-icons/Ionicons';
import checkMark from '../../assets/checkMark.png';

import Header from '../../components/header';
import GlobalStyles, {mainColor, secondaryColor} from '../../styles/styles';
import {blockchain, network} from '../../utils/constants';
import ContextModule from '../../utils/contextModule';
import {
  balancedSaving,
  epsilonRound,
  getAsyncStorageValue,
  getEncryptedStorageValue,
  percentageSaving,
} from '../../utils/utils';
import Cam from './components/cam';
import CryptoSign from './components/cryptoSign';
import KeyboardAwareScrollViewComponent from './components/keyboardAvoid';

function setTokens(array) {
  return array.map((item, index) => {
    return {
      ...item,
      index: index,
      value: index.toString(),
      label: item.name,
      key: item.symbol,
    };
  });
}

function findIndexByProperty(array, property, value) {
  for (let i = 0; i < array.length; i++) {
    if (array[i][property] === value) {
      return i;
    }
  }
  return -1; // Return -1 if the object with the specified property and value is not found
}

const SendWalletBaseState = {
  // Base

  usdConversion: blockchain.tokens.map(() => 1),
  // Transaction settings
  toAddress: [''], // ""
  amount: [''], //
  tokenSelected: [setTokens(blockchain.tokens)[0]], // ""
  transaction: [{}],
  transactionBatch: {},
  transactionSavings: {
    amount: 0.0,
    tokenSelected: setTokens(blockchain.tokens)[0],
  },
  scannerSelector: 0,
  transactionDisplay: {
    name: setTokens(blockchain.tokens)[0].symbol,
    decimals: setTokens(blockchain.tokens)[0].decimals,
    amount: 0,
    gas: 0,
  },
  // Status
  stage: 0,
  hash: '', // ""
  check: 'Check',
  modal: false, // false
  explorerURL: '',
  status: 'Processing...',
  errorText: '',
  maxSelected: false,
  maxLoading: false,
  loading: true,
  // Savings Flag
  savingsFlag: false,
  protocolSelected: 0,
  percentage: 0,
};

class SendWallet extends Component {
  constructor(props) {
    super(props);
    this.state = SendWalletBaseState;
    this.aptos = new Aptos(blockchain.aptosConfig);
  }

  static contextType = ContextModule;

  async componentDidMount() {
    this.props.navigation.addListener('focus', async () => {
      console.log(this.props.route.name);
      const usdConversion = await getAsyncStorageValue('usdConversion');
      const savingsFlag = await getAsyncStorageValue('savingsFlag');
      const protocolSelected = await getAsyncStorageValue('protocolSelected');
      const percentage = await getAsyncStorageValue('percentage');
      this.setState({
        usdConversion: usdConversion ?? SendWalletBaseState.usdConversion,
        protocolSelected:
          protocolSelected ?? SendWalletBaseState.protocolSelected,
        savingsFlag: savingsFlag ?? SendWalletBaseState.savingsFlag,
        percentage: percentage ?? SendWalletBaseState.percentage,
        loading: false,
      });
    });
    this.props.navigation.addListener('blur', async () => {
      this.setState(SendWalletBaseState);
    });
  }

  // Utils

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

  async sign() {
    this.setState({
      status: 'Processing...',
      stage: 2,
      explorerURL: '',
    });
    try {
      const privateKeyTemp = await getEncryptedStorageValue('privateKey');
      const privateKey = new Ed25519PrivateKey(privateKeyTemp);
      const account = Account.fromPrivateKey({privateKey});
      this.aptos.transaction.batch.forSingleAccount({
        sender: account,
        data: this.state.transactionBatch,
      });
      this.aptos.transaction.batch.on(
        TransactionWorkerEventsEnum.TransactionExecuted,
        async data => {
          console.log('Transaction executed: ', data);
        },
      );
      this.aptos.transaction.batch.on(
        TransactionWorkerEventsEnum.TransactionExecutionFailed,
        async data => {
          console.log('Transaction executed failed: ', data);
        },
      );
      this.aptos.transaction.batch.on(
        TransactionWorkerEventsEnum.TransactionSendFailed,
        async data => {
          console.log('Transaction send failed: ', data);
        },
      );
      this.aptos.transaction.batch.on(
        TransactionWorkerEventsEnum.TransactionSent,
        async data => {
          console.log('Transaction sent: ', data);
        },
      );
      this.aptos.transaction.batch.on(
        TransactionWorkerEventsEnum.ExecutionFinish,
        async data => {
          this.aptos.transaction.batch.removeAllListeners();
          this.setState({
            explorerURL: `${blockchain.blockExplorer}account/${this.context.value.publicKey}?network=${network}#coins`,
            status: 'Confirmed',
          });
        },
      );
    } catch (e) {
      console.log(e);
      ToastAndroid.show(e.message, ToastAndroid.SHORT);
      this.setState({
        stage: 0,
        explorerURL: '',
        transactionBatch: {},
        check: 'Check',
        loading: false,
        modal: false,
        status: 'Processing...',
        errorText: '',
      });
    }
  }

  async getTransaction(address, amountIn, tokenAddress) {
    return {
      type: 'entry_function_payload',
      function:
        tokenAddress === blockchain.tokens[0].address
          ? '0x1::aptos_account::transfer'
          : '0x1::aptos_account::transfer_coins',
      typeArguments:
        tokenAddress === blockchain.tokens[0].address ? [] : [tokenAddress],
      functionArguments: [address, parseInt(amountIn.toString())],
    };
  }

  async batchTransfer() {
    try {
      const balance = await this.aptos.getAccountCoinAmount({
        accountAddress: this.context.value.publicKey,
        coinType: blockchain.tokens[0].address,
      });
      let transactions = await Promise.all(
        this.state.toAddress.map((address, index) =>
          this.getTransaction(
            address,
            ethers.utils.parseUnits(
              this.state.amount[index],
              this.state.tokenSelected[index].decimals,
            ),
            this.state.tokenSelected[index].address,
          ),
        ),
      );
      const usdValues = this.state.toAddress.map((_, index) => {
        try {
          return this.state.usdConversion[
            findIndexByProperty(
              blockchain.tokens,
              'address',
              this.state.tokenSelected[index].address,
            )
          ];
        } catch {
          return 0;
        }
      });
      if (this.state.savingsFlag) {
        const totalInUsd = this.state.toAddress.map(
          (_, index) => this.state.amount[index] * usdValues[index],
        );
        const totalOnAPT =
          totalInUsd.reduce((a, b) => a + b, 0) / this.state.usdConversion[0];
        const savedAmount =
          this.state.protocolSelected === 0
            ? balancedSaving(totalOnAPT, this.state.usdConversion[0])
            : percentageSaving(totalOnAPT, this.state.percentage);
        const transactionSavings = await this.getTransaction(
          this.context.value.publicKeySavings,
          ethers.utils.parseUnits(
            epsilonRound(savedAmount, blockchain.decimals).toString(),
            blockchain.decimals,
          ),
          blockchain.tokens[0].address,
        );
        transactions.push(transactionSavings);
        this.setState({
          transactionSavings: {
            ...this.state.transactionSavings,
            amount: savedAmount,
          },
        });
      }
      let totalAmount = parseInt(ethers.utils.parseEther('0').toString());
      transactions.forEach(item => {
        totalAmount = totalAmount + item.functionArguments[1];
      });
      console.log(totalAmount);
      const individualTransactions = await Promise.all(
        transactions.map(data =>
          this.aptos.transaction.build.simple({
            sender: this.context.value.publicKey,
            data,
          }),
        ),
      );
      const privateKeyTemp = await getEncryptedStorageValue('privateKey');
      const privateKey = new Ed25519PrivateKey(privateKeyTemp);
      const account = Account.fromPrivateKey({privateKey});
      const simulations = await Promise.all(
        individualTransactions.map(transaction =>
          this.aptos.transaction.simulate.simple({
            signerPublicKey: account.publicKey,
            transaction,
          }),
        ),
      );
      const gas = simulations.reduce((sum, current) => {
        const gasUnitPrice = parseInt(current[0].gas_unit_price, 10);
        const gasUsed = parseInt(current[0].gas_used, 10);
        return sum + gasUnitPrice * gasUsed;
      }, 0);
      const check = balance > gas + parseInt(totalAmount.toString());
      let errorText = '';
      if (!check) {
        errorText = `Not enough balance`;
        throw 'Not enough balance';
      }
      const displayGas = parseFloat(
        ethers.utils.formatUnits(gas, blockchain.tokens[0].decimals),
      );
      const displayAmount = parseFloat(
        ethers.utils.formatUnits(
          parseInt(totalAmount.toString()),
          blockchain.tokens[0].decimals,
        ),
      );
      const transactionDisplay = {
        name: blockchain.tokens[0].symbol,
        amount: epsilonRound(displayAmount, 8),
        gas: epsilonRound(displayGas, 8),
      };
      this.setState({
        transactionDisplay,
        transactionBatch: transactions,
        check: 'Check',
        loading: false,
        modal: check,
        errorText,
      });
    } catch (e) {
      console.log(e);
      console.log('Bad Quote');
    }
  }

  render() {
    const modalScale = 0.5;

    return (
      <SafeAreaView style={GlobalStyles.container}>
        <Header />
        <Modal
          visible={this.state.modal}
          transparent={true}
          animationType="slide">
          <View
            style={{
              alignSelf: 'center',
              backgroundColor: '#1E2423',
              width: Dimensions.get('window').width * 0.94,
              height: Dimensions.get('window').height * modalScale,
              marginTop: Dimensions.get('window').height * (0.99 - modalScale),
              borderWidth: 2,
              borderColor: mainColor,
              padding: 20,
              borderRadius: 25,
              justifyContent: 'space-around',
              alignItems: 'center',
            }}>
            <Text
              style={{
                textAlign: 'center',
                color: 'white',
                fontSize: 30,
                width: '80%',
              }}>
              Transaction
            </Text>
            <View
              style={{
                backgroundColor: mainColor,
                height: 1,
                width: '90%',
                marginVertical: 10,
              }}
            />
            <Text
              style={{
                textAlign: 'center',
                color: 'white',
                fontSize: 26,
                width: '100%',
              }}>
              transfer_coins
            </Text>
            <View
              style={{
                backgroundColor: mainColor,
                height: 1,
                width: '90%',
                marginVertical: 10,
              }}
            />
            <Text
              style={{
                textAlign: 'center',
                color: 'white',
                fontSize: 20,
                width: '100%',
              }}>
              Amount:
            </Text>
            <Text
              style={{
                textAlign: 'center',
                color: 'white',
                fontSize: 24,
                width: '100%',
              }}>
              {`${epsilonRound(this.state.transactionDisplay.amount, 8)}`}{' '}
              {this.state.transactionDisplay.name}
              {' ( $'}
              {epsilonRound(
                this.state.transactionDisplay.amount *
                  this.state.usdConversion[0],
                2,
              )}
              {' )'}
            </Text>
            <View
              style={{
                backgroundColor: mainColor,
                height: 1,
                width: '90%',
                marginVertical: 10,
              }}
            />
            <Text
              style={{
                textAlign: 'center',
                color: 'white',
                fontSize: 20,
                width: '100%',
              }}>
              Gas:
            </Text>
            <Text
              style={{
                textAlign: 'center',
                color: 'white',
                fontSize: 24,
                width: '100%',
              }}>
              {this.state.transactionDisplay.gas} {blockchain.token}
              {' ( $'}
              {epsilonRound(
                this.state.transactionDisplay.gas * this.state.usdConversion[0],
                2,
              )}
              {' )'}
            </Text>
            <View
              style={{
                backgroundColor: mainColor,
                height: 1,
                width: '90%',
                marginVertical: 10,
              }}
            />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                width: '100%',
              }}>
              <Pressable
                style={[
                  GlobalStyles.singleModalButton,
                  {
                    width: '45%',
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                    borderRightColor: 'black',
                    borderRightWidth: 2,
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                ]}
                onPress={async () => {
                  await this.setStateAsync({
                    modal: false,
                  });

                  this.setState({
                    stage: 1,
                  });
                }}>
                <Text style={[GlobalStyles.singleModalButtonText]}>Accept</Text>
              </Pressable>
              <Pressable
                style={[
                  GlobalStyles.singleModalButton,
                  {
                    width: '45%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                  },
                ]}
                onPress={() =>
                  this.setState({
                    transactionBatch: {},
                    check: 'Check',
                    loading: false,
                    modal: false,
                  })
                }>
                <Text style={[GlobalStyles.singleModalButtonText]}>Reject</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
        {this.state.stage === 0 && (
          <KeyboardAwareScrollViewComponent>
            <SafeAreaView style={GlobalStyles.mainSend}>
              <ScrollView
                contentContainerStyle={{
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                {this.state.transaction.map((_, index) => (
                  <Fragment key={index}>
                    <View
                      style={{
                        alignItems: 'center',
                      }}>
                      {
                        // this is only for styling
                      }
                      {index === 0 && <View style={{marginTop: 20}} />}
                      <Text style={GlobalStyles.formTitle}>Address</Text>
                      <View
                        style={{
                          width: Dimensions.get('screen').width,
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}>
                        <View style={{width: '90%'}}>
                          <TextInput
                            multiline
                            numberOfLines={1}
                            style={[
                              GlobalStyles.input,
                              {fontSize: 14, height: 60, paddingHorizontal: 20},
                            ]}
                            keyboardType="default"
                            value={this.state.toAddress[index]}
                            onChangeText={value => {
                              let toAddress = [...this.state.toAddress];
                              toAddress[index] = value;
                              this.setState({toAddress});
                            }}
                          />
                        </View>
                        <Pressable
                          onPress={() => {
                            const scannerSelector = index;
                            this.setStateAsync({
                              scannerSelector,
                              stage: 10,
                            });
                          }}
                          style={{width: '10%'}}>
                          <IconIonIcons
                            name="qr-code"
                            size={30}
                            color={'white'}
                          />
                        </Pressable>
                      </View>
                      <Text style={GlobalStyles.formTitle}>Select Token</Text>
                      <RNPickerSelect
                        style={{
                          inputAndroidContainer: {
                            textAlign: 'center',
                          },
                          inputAndroid: {
                            textAlign: 'center',
                            color: 'gray',
                          },
                          viewContainer: {
                            ...GlobalStyles.input,
                            width: Dimensions.get('screen').width * 0.9,
                          },
                        }}
                        value={this.state.tokenSelected[index].value}
                        items={setTokens(blockchain.tokens)}
                        onValueChange={token => {
                          let tokenSelected = [...this.state.tokenSelected];
                          tokenSelected[index] = setTokens(blockchain.tokens)[
                            token
                          ];
                          this.setState({
                            tokenSelected,
                          });
                        }}
                      />
                      <Text style={GlobalStyles.formTitle}>Amount</Text>
                      <View
                        style={{
                          width: Dimensions.get('screen').width,
                          flexDirection: 'row',
                          justifyContent: 'space-around',
                          alignItems: 'center',
                        }}>
                        <View style={{width: '100%'}}>
                          <TextInput
                            style={[GlobalStyles.input]}
                            keyboardType="decimal-pad"
                            value={this.state.amount[index]}
                            onChangeText={value => {
                              let amount = [...this.state.amount];
                              amount[index] = value;
                              this.setState({amount});
                            }}
                          />
                        </View>
                      </View>
                    </View>
                    {this.state.check === 'Check Again' && (
                      <Text
                        style={{
                          fontSize: 20,
                          color: '#F00',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          paddingHorizontal: 20,
                        }}>
                        {this.state.errorText}
                      </Text>
                    )}
                    <View
                      style={{
                        borderWidth: 1,
                        borderColor: mainColor,
                        width: '90%',
                        marginVertical: 20,
                      }}
                    />
                  </Fragment>
                ))}
                <Pressable
                  disabled={this.state.loading}
                  style={[
                    GlobalStyles.buttonStyleDot,
                    {
                      width: 50,
                      height: 50,
                      paddingBottom: 3,
                      paddingLeft: 0,
                    },
                  ]}
                  onPress={() => {
                    let [amount, toAddress, transaction, tokenSelected] = [
                      [...this.state.amount],
                      [...this.state.toAddress],
                      [...this.state.transaction],
                      [...this.state.tokenSelected],
                    ];
                    amount.push('');
                    toAddress.push('');
                    transaction.push({});
                    tokenSelected.push(setTokens(blockchain.tokens)[0]);
                    this.setState({
                      amount,
                      toAddress,
                      transaction,
                      tokenSelected,
                    });
                  }}>
                  <Text style={{fontSize: 30, color: 'white'}}>+</Text>
                </Pressable>
                <Pressable
                  disabled={this.state.loading}
                  style={[
                    GlobalStyles.buttonStyle,
                    this.state.loading ? {opacity: 0.5} : {},
                  ]}
                  onPress={async () => {
                    await this.setStateAsync({loading: true});
                    await this.batchTransfer();
                    await this.setStateAsync({loading: false});
                  }}>
                  <Text style={[GlobalStyles.buttonText]}>
                    {this.state.check}
                  </Text>
                </Pressable>
              </ScrollView>
            </SafeAreaView>
          </KeyboardAwareScrollViewComponent>
        )}
        {this.state.stage === 1 && (
          <View style={GlobalStyles.mainSend}>
            <CryptoSign
              transaction={this.state.transactionBatch}
              cancelTrans={e =>
                this.setState({
                  stage: 0,
                  explorerURL: '',
                  transactionBatch: {},
                  check: 'Check',
                  loading: false,
                  modal: false,
                  status: 'Processing...',
                  errorText: '',
                })
              }
              signEthereum={e => this.sign()}
            />
          </View>
        )}
        {this.state.stage === 2 && (
          <View style={GlobalStyles.mainSend}>
            <View
              style={{
                flex: 1,
                flexDirection: 'column',
                justifyContent: 'space-around',
                alignItems: 'center',
              }}>
              <Image
                source={checkMark}
                alt="check"
                style={{width: 200, height: 200, marginTop: 30}}
              />
              <Text
                style={{
                  textShadowRadius: 1,
                  fontSize: 28,
                  fontWeight: 'bold',
                  marginTop: 30,
                  color:
                    this.state.status === 'Confirmed'
                      ? mainColor
                      : secondaryColor,
                }}>
                {this.state.status}
              </Text>
              <ScrollView style={{marginTop: 30}}>
                {this.state.transaction.map((_, index) => {
                  return (
                    <View
                      key={index}
                      style={[
                        GlobalStyles.networkShow,
                        {width: Dimensions.get('screen').width * 0.9},
                      ]}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-around',
                        }}>
                        <View style={{marginHorizontal: 20}}>
                          <Text style={{fontSize: 20, color: 'white'}}>
                            {this.state.tokenSelected[index].name}
                          </Text>
                          <Text style={{fontSize: 14, color: 'white'}}>
                            transfer_coins
                          </Text>
                        </View>
                      </View>
                      <View
                        style={{
                          marginHorizontal: 20,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        <View style={{marginHorizontal: 10}}>
                          {this.state.tokenSelected[index].icon}
                        </View>
                        <Text style={{color: 'white'}}>
                          {`${epsilonRound(this.state.amount[index], 4)}`}{' '}
                          {this.state.tokenSelected[index].symbol}
                        </Text>
                      </View>
                    </View>
                  );
                })}
                {this.state.savingsFlag && (
                  <View
                    style={[
                      GlobalStyles.networkShow,
                      {width: Dimensions.get('screen').width * 0.9},
                    ]}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-around',
                      }}>
                      <View style={{marginHorizontal: 20}}>
                        <Text style={{fontSize: 20, color: 'white'}}>
                          {this.state.transactionSavings.tokenSelected.name}
                        </Text>
                        <Text style={{fontSize: 14, color: 'white'}}>
                          transfer_coins
                        </Text>
                      </View>
                    </View>
                    <View
                      style={{
                        marginHorizontal: 20,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <View style={{marginHorizontal: 10}}>
                        {this.state.transactionSavings.tokenSelected.icon}
                      </View>
                      <Text style={{color: 'white'}}>
                        {`${epsilonRound(
                          this.state.transactionSavings.amount,
                          4,
                        )}`}{' '}
                        {this.state.transactionSavings.tokenSelected.symbol}
                      </Text>
                    </View>
                  </View>
                )}
              </ScrollView>
              <View>
                <Pressable
                  disabled={this.state.explorerURL === ''}
                  style={[
                    GlobalStyles.buttonStyle,
                    {
                      backgroundColor: mainColor,
                    },
                    this.state.explorerURL === '' ? {opacity: 0.5} : {},
                  ]}
                  onPress={() => Linking.openURL(this.state.explorerURL)}>
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: 'bold',
                      color: 'white',
                      textAlign: 'center',
                    }}>
                    View on Explorer
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    GlobalStyles.buttonStyle,
                    {
                      backgroundColor: secondaryColor,
                    },
                    this.state.explorerURL === '' ? {opacity: 0.5} : {},
                  ]}
                  onPress={() =>
                    this.setState({
                      transactionBatch: {},
                      toAddress: [''], // ""
                      amount: [''], //
                      tokenSelected: [setTokens(blockchain.tokens)[0]], // ""
                      transaction: [{}],
                      check: 'Check',
                      loading: false,
                      modal: false,
                      stage: 0,
                    })
                  }
                  disabled={this.state.explorerURL === ''}>
                  <Text
                    style={{
                      color: 'white',
                      fontSize: 24,
                      fontWeight: 'bold',
                    }}>
                    Done
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
        {
          // Scan QR
        }
        {this.state.stage === 10 && (
          <View
            style={[GlobalStyles.mainSend, {justifyContent: 'space-evenly'}]}>
            <View>
              <Text style={{color: 'white', fontSize: 28}}>Scan QR</Text>
            </View>
            <View
              style={{
                height: Dimensions.get('screen').height * 0.5,
                width: Dimensions.get('screen').width * 0.8,
                marginVertical: 20,
                borderColor: mainColor,
                borderWidth: 5,
                borderRadius: 10,
              }}>
              <Cam
                callbackAddress={e => {
                  let [toAddress] = [[...this.state.toAddress]];
                  toAddress[this.state.scannerSelector] = e;
                  this.setState({
                    toAddress,
                    stage: 0,
                  });
                }}
              />
            </View>
            <Pressable
              style={[GlobalStyles.buttonStyle]}
              onPress={async () => {
                this.setState({
                  stage: 0,
                });
              }}>
              <Text style={{color: 'white', fontSize: 24, fontWeight: 'bold'}}>
                Cancel
              </Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    );
  }
}

export default SendWallet;
