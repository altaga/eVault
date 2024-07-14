import {
  Account,
  Aptos,
  Ed25519PrivateKey,
  TransactionWorkerEventsEnum,
} from '@aptos-labs/ts-sdk';
import {GOOGLE_URL_API} from '@env';
import {ethers} from 'ethers';
import React, {Component, Fragment} from 'react';
import {
  Dimensions,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import CreditCard from 'react-native-credit-card';
import RNPickerSelect from 'react-native-picker-select';
import Crypto from 'react-native-quick-crypto';
import checkMark from '../../../assets/checkMark.png';
import GlobalStyles, {
  main,
  mainColor,
  secondaryColor,
} from '../../../styles/styles';
import {
  CloudPublicKeyEncryption,
  blockchain,
  network,
  refreshTime,
} from '../../../utils/constants';
import ContextModule from '../../../utils/contextModule';
import {
  arraySum,
  epsilonRound,
  getAsyncStorageValue,
  getEncryptedStorageValue,
  randomNumber,
  setAsyncStorageValue,
} from '../../../utils/utils';
import CryptoSign from '../components/cryptoSign';
import ReadCard from '../components/readCard';

function setTokens(array) {
  return array.map((item, index) => {
    return {
      ...item,
      value: index.toString(),
      index: index,
      label: item.name,
      key: item.symbol,
    };
  });
}

const generator = require('creditcard-generator');

const BasePublicKey =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

const baseTab3State = {
  // Account Details
  balancesCard: blockchain.tokens.map(() => 0),
  usdConversion: blockchain.tokens.map(() => 1),
  activeTokens: blockchain.tokens.map(() => true), // to do later
  tokenSelected: setTokens(blockchain.tokens)[0],
  // Card
  cvc: randomNumber(111, 999),
  expiry: '1226',
  name: 'Vault Card',
  number: generator.GenCC('VISA'),
  imageFront: require('../../../assets/cardAssets/card-front.png'),
  imageBack: require('.../../../assets/cardAssets/card-back.png'),
  // Utils
  stage: 0,
  status: 'Processing...',
  nfcSupported: true,
  loading: false,
  keyboardHeight: 0,
  modal: false,
  transaction: {},
  transactionDisplay: {
    name: 'APT',
    amount: 0,
    gas: 0,
  },
  cardInfo: {
    card: '',
    exp: '',
  },
  // Card Transactions
  amountAdd: '',
  amountRemove: '',
  explorerURL: '',
};

export default class Tab3 extends Component {
  constructor(props) {
    super(props);
    this.state = baseTab3State;
    this.aptos = new Aptos(blockchain.aptosConfig);
  }

  static contextType = ContextModule;

  async getLastRefreshCard() {
    try {
      const lastRefreshCard = await getAsyncStorageValue('lastRefreshCard');
      if (lastRefreshCard === null) throw 'Set First Date';
      return lastRefreshCard;
    } catch (err) {
      await setAsyncStorageValue({lastRefreshCard: 0});
      return 0;
    }
  }

  encryptCardData(cardData) {
    const encrypted = Crypto.publicEncrypt(
      {
        key: CloudPublicKeyEncryption,
      },
      Buffer.from(cardData, 'utf8'),
    );
    return encrypted.toString('base64');
  }

  async setupCloudCard() {
    return new Promise((resolve, reject) => {
      const myHeaders = new Headers();
      myHeaders.append('Content-Type', 'application/json');
      const raw = JSON.stringify({
        data: this.encryptCardData(
          `${this.state.cardInfo.card}${this.state.cardInfo.exp}`,
        ),
        pubKey: this.context.value.publicKey,
      });
      const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow',
      };

      fetch(`${GOOGLE_URL_API}/AddCard`, requestOptions)
        .then(response => response.text())
        .then(result => resolve(result))
        .catch(error => reject(error));
    });
  }

  async componentDidMount() {
    const usdConversion = await getAsyncStorageValue('usdConversion');
    const balancesCard = await getAsyncStorageValue('balancesCard');
    await this.setStateAsync({
      balancesCard: balancesCard ?? baseTab3State.balancesCard,
      usdConversion: usdConversion ?? baseTab3State.usdConversion,
      loading: false,
    });
    if (this.context.value.publicKeyCard !== BasePublicKey) {
      const refreshCheck = Date.now();
      const lastRefresh = await this.getLastRefreshCard();
      if (refreshCheck - lastRefresh >= refreshTime) {
        // 2.5 minutes
        console.log('Refreshing...');
        await setAsyncStorageValue({lastRefreshCard: Date.now()});
        await this.refresh();
      } else {
        console.log(
          `Next refresh Available: ${Math.round(
            (refreshTime - (refreshCheck - lastRefresh)) / 1000,
          )} Seconds`,
        );
      }
    }
  }

  async refresh() {
    await this.setStateAsync({refreshing: true});
    await this.getCardBalance();
    await this.setStateAsync({refreshing: false});
  }

  async getCardBalance() {
    const balancesTemp = await Promise.all(
      blockchain.tokens.map(token =>
        this.aptos.getAccountCoinAmount({
          accountAddress: this.context.value.publicKeyCard,
          coinType: token.address,
        }),
      ),
    );
    const balancesCard = blockchain.tokens.map((token, index) =>
      ethers.utils.formatUnits(balancesTemp[index], token.decimals),
    );
    await setAsyncStorageValue({balancesCard});
    await this.setStateAsync({balancesCard});
  }

  async setupAccount() {
    await this.setStateAsync({loading: true});
    try {
      const publicKeyCard = await this.setupCloudCard();
      await setAsyncStorageValue({
        publicKeyCard,
      });
      this.setState({loading: false, stage: 0});
      this.context.setValue({publicKeyCard});
    } catch (err) {
      console.log(err);
      await this.setStateAsync({loading: false});
    }
  }

  async getTransaction(address, amountIn, tokenAddress) {
    return {
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
      let transactions = await Promise.all([
        this.getTransaction(
          this.context.value.publicKeyCard,
          ethers.utils.parseUnits(
            this.state.amountAdd,
            this.state.tokenSelected.decimals,
          ),
          this.state.tokenSelected.address,
        ),
      ]);
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
      console.log(gas);
      const check = gas > 0;
      let errorText = '';
      if (!check) {
        errorText = `Not enough balance`;
        throw 'Not enough balance';
      }
      const displayGas = parseFloat(
        ethers.utils.formatUnits(gas, blockchain.tokens[0].decimals),
      );
      const displayAmount = parseFloat(this.state.amountAdd);
      const transactionDisplay = {
        name: this.state.tokenSelected.symbol,
        amount: epsilonRound(displayAmount, this.state.tokenSelected.decimals),
        gas: epsilonRound(displayGas, blockchain.tokens[0].decimals),
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

  async getCardInfo() {
    await this.setStateAsync({stage: 2});
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
        TransactionWorkerEventsEnum.ExecutionFinish,
        async data => {
          console.log(data);
          this.aptos.transaction.batch.removeAllListeners();
          this.setState({
            explorerURL: `${blockchain.blockExplorer}account/${this.context.value.publicKey}?network=${network}#coins`,
            status: 'Confirmed',
          });
        },
      );
    } catch (e) {
      console.log(e);
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

  render() {
    const modalScale = 0.5;
    return (
      <Fragment>
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
                  this.state.usdConversion[this.state.tokenSelected.index],
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
                onPress={() => this.setState(baseTab3State)}>
                <Text style={[GlobalStyles.singleModalButtonText]}>Reject</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
        <View
          style={{
            justifyContent: 'space-evenly',
            alignItems: 'center',
            height: '100%',
            width: Dimensions.get('window').width,
          }}>
          <ScrollView
            style={GlobalStyles.tab3Container}
            contentContainerStyle={[
              GlobalStyles.tab2ScrollContainer,
              {
                height:
                  this.context.value.publicKeyCard !== BasePublicKey
                    ? 'auto'
                    : '100%',
              },
            ]}>
            {this.context.value.publicKeyCard !== BasePublicKey ? (
              <Fragment>
                {
                  // Stage 0
                  this.state.stage === 0 && (
                    <Fragment>
                      <View style={{height: 180, marginVertical: 20}}>
                        <CreditCard
                          type={this.state.type}
                          imageFront={this.state.imageFront}
                          imageBack={this.state.imageBack}
                          shiny={false}
                          bar={false}
                          number={this.state.number}
                          name={this.state.name}
                          expiry={this.state.expiry}
                          cvc={this.state.cvc}
                        />
                      </View>
                      <View
                        style={{
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderBottomWidth: 2,
                          borderTopWidth: 2,
                          paddingVertical: 15,
                          marginBottom: 15,
                          borderColor: mainColor,
                          width: '90%',
                        }}>
                        <Text style={[GlobalStyles.exoTitle]}>
                          Card Balance{' '}
                        </Text>
                        <Text
                          style={{
                            fontSize: 38,
                            color: 'white',
                            marginTop: 10,
                          }}>
                          {`$ ${epsilonRound(
                            arraySum(
                              this.state.balancesCard.map(
                                (x, i) => x * this.state.usdConversion[i],
                              ),
                            ),
                            2,
                          )} USD`}
                        </Text>
                      </View>
                      <View
                        style={{
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderBottomWidth: 2,
                          paddingBottom: 15,
                          marginBottom: 15,
                          borderColor: mainColor,
                          width: '90%',
                        }}>
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
                              width: '100%',
                            },
                          }}
                          value={this.state.tokenSelected.value}
                          items={setTokens(blockchain.tokens)}
                          onValueChange={index => {
                            this.setState({
                              tokenSelected: setTokens(blockchain.tokens)[
                                parseInt(index)
                              ],
                            });
                          }}
                        />
                        <Text style={GlobalStyles.formTitle}>Add Balance</Text>
                        <View
                          style={{
                            width: '100%',
                            flexDirection: 'row',
                            justifyContent: 'space-evenly',
                            alignItems: 'center',
                          }}>
                          <TextInput
                            style={[GlobalStyles.input, {width: '60%'}]}
                            keyboardType="decimal-pad"
                            value={this.state.amountAdd}
                            onChangeText={value =>
                              this.setState({amountAdd: value})
                            }
                          />
                          <Pressable
                            disabled={this.state.loading}
                            style={[
                              GlobalStyles.buttonStyle,
                              {
                                width: '35%',
                                padding: 10,
                                marginLeft: '5%',
                              },
                              this.state.loading ? {opacity: 0.5} : {},
                            ]}
                            onPress={async () => {
                              await this.setStateAsync({loading: true});
                              await this.batchTransfer();
                              await this.setStateAsync({
                                loading: false,
                              });
                            }}>
                            <Text
                              style={[GlobalStyles.buttonText, {fontSize: 18}]}>
                              {this.state.loading ? 'Adding...' : 'Add'}
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                      {blockchain.tokens.map((token, index) =>
                        this.state.activeTokens[index] ? (
                          <View key={index} style={GlobalStyles.network}>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-around',
                              }}>
                              <View style={{marginHorizontal: 20}}>
                                <View>{token.icon}</View>
                              </View>
                              <View style={{justifyContent: 'center'}}>
                                <Text
                                  style={{
                                    fontSize: 18,
                                    color: 'white',
                                  }}>
                                  {token.name}
                                </Text>
                                <View
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'flex-start',
                                  }}>
                                  <Text
                                    style={{
                                      fontSize: 12,
                                      color: 'white',
                                    }}>
                                    {this.state.balancesCard[index] === 0
                                      ? '0'
                                      : this.state.balancesCard[index] < 0.001
                                      ? '<0.01'
                                      : epsilonRound(
                                          this.state.balancesCard[index],
                                          2,
                                        )}{' '}
                                    {token.symbol}
                                  </Text>
                                  <Text
                                    style={{
                                      fontSize: 12,
                                      color: 'white',
                                    }}>
                                    {`  -  ($${epsilonRound(
                                      this.state.usdConversion[index],
                                      4,
                                    )} USD)`}
                                  </Text>
                                </View>
                              </View>
                            </View>
                            <View style={{marginHorizontal: 20}}>
                              <Text style={{color: 'white'}}>
                                $
                                {epsilonRound(
                                  this.state.balancesCard[index] *
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
                    </Fragment>
                  )
                }
                {
                  // Stage 1
                  this.state.stage === 1 && (
                    <View style={[GlobalStyles.mainSend, {height: '100%'}]}>
                      <CryptoSign
                        transaction={this.state.transaction}
                        cancelTrans={() =>
                          this.setState({
                            stage: 0,
                            explorerURL: '',
                            transaction: {},
                            check: 'Check',
                            loading: false,
                            modal: false,
                            status: 'Processing...',
                            errorText: '',
                          })
                        }
                        signEthereum={() => this.sign()}
                      />
                    </View>
                  )
                }
                {
                  // Stage 2
                  this.state.stage === 2 && (
                    <View
                      style={[
                        GlobalStyles.mainSend,
                        {height: Dimensions.get('screen').height * 0.64},
                      ]}>
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
                          style={{width: 200, height: 200}}
                        />
                        <Text
                          style={{
                            textShadowRadius: 1,
                            fontSize: 28,
                            fontWeight: 'bold',
                            color:
                              this.state.status === 'Confirmed'
                                ? mainColor
                                : secondaryColor,
                          }}>
                          {this.state.status}
                        </Text>
                        <View>
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
                                  Transaction
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
                                justifyContent: 'flex-start',
                              }}>
                              <View style={{marginHorizontal: 10}}>
                                {this.state.tokenSelected.icon}
                              </View>
                              <Text style={{color: 'white'}}>
                                {`${epsilonRound(
                                  this.state.transactionDisplay.amount,
                                  4,
                                )}`}{' '}
                                {this.state.transactionDisplay.name}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <View>
                          <Pressable
                            disabled={this.state.explorerURL === ''}
                            style={[
                              GlobalStyles.buttonStyle,
                              this.state.explorerURL === ''
                                ? {opacity: 0.5}
                                : {},
                            ]}
                            onPress={() =>
                              Linking.openURL(this.state.explorerURL)
                            }>
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
                                backgroundColor: '#6978ff',
                              },
                              this.state.explorerURL === ''
                                ? {opacity: 0.5}
                                : {},
                            ]}
                            onPress={async () => {
                              await this.refresh();
                              await this.setStateAsync({
                                stage: 0,
                                explorerURL: '',
                                transaction: {},
                                transactionDisplay:
                                  baseTab3State.transactionDisplay,
                                check: 'Check',
                                loading: false,
                                modal: false,
                                status: 'Processing...',
                                errorText: '',
                                tokenSelected: setTokens(blockchain.tokens)[0],
                                amountAdd: '',
                              });
                            }}
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
                  )
                }
              </Fragment>
            ) : (
              <>
                {
                  // Stage 0
                  this.state.stage === 0 && (
                    <View
                      style={{
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '90%',
                      }}>
                      <Text
                        style={[
                          GlobalStyles.exoTitle,
                          {
                            textAlign: 'center',
                            fontSize: 24,
                            paddingBottom: 20,
                          },
                        ]}>
                        Create Card Account
                      </Text>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'center',
                          width: '100%',
                        }}>
                        <Pressable
                          disabled={this.state.loading}
                          style={[
                            GlobalStyles.buttonStyle,
                            this.state.loading ? {opacity: 0.5} : {},
                          ]}
                          onPress={() => this.setState({stage: 1})}>
                          <Text style={[GlobalStyles.buttonText]}>
                            {this.state.loading
                              ? 'Creating...'
                              : 'Create Account'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  )
                }
                {
                  // Stage 1
                  this.state.stage === 1 && (
                    <React.Fragment>
                      <View
                        style={{
                          justifyContent: 'space-evenly',
                          alignItems: 'center',
                          height: '100%',
                        }}>
                        <Text style={GlobalStyles.title}>
                          {' '}
                          Merge Physical Card to Card Account
                        </Text>
                        <ReadCard
                          cardInfo={async cardInfo => {
                            if (cardInfo) {
                              await this.setStateAsync({cardInfo});
                              this.setupAccount();
                            }
                          }}
                        />
                      </View>
                    </React.Fragment>
                  )
                }
              </>
            )}
          </ScrollView>
        </View>
      </Fragment>
    );
  }
}
