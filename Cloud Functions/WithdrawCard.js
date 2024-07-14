const functions = require('@google-cloud/functions-framework');
const crypto = require("crypto");
const Firestore = require("@google-cloud/firestore");
const {
  Account,
  Ed25519PrivateKey,
  AptosConfig,
  Network,
  Aptos,
  TransactionWorkerEventsEnum
} = require("@aptos-labs/ts-sdk");

const privateKey = ``;

const db = new Firestore({
  projectId: "evault",
  keyFilename: "credential.json",
});

const Accounts = db.collection("XXXXXXXXX");

const aptosConfig = new AptosConfig({ network: Network.MAINNET });
const aptos = new Aptos(aptosConfig);

functions.http('helloHttp', async (req, res) => {
   try {
    const decrypted = decryptText(req.body.data);
    const data = req.body.transaction;
    const query = await Accounts.where("cardHash", "==", decrypted.toString()).get();
    if (query.empty) {
      res.send(`Bad Request`);
    } else {
      const privateKeyTemp = query.docs[0].data().cardPrivateKey;
      const privateKey = new Ed25519PrivateKey(privateKeyTemp);
      const account = Account.fromPrivateKey({privateKey});
      console.log(data)
      aptos.transaction.batch.forSingleAccount({
        sender: account,
        data
      });
      console.log(account.accountAddress.toString())
      aptos.transaction.batch.on(
        TransactionWorkerEventsEnum.ExecutionFinish,
        async (data) => {
          aptos.transaction.batch.removeAllListeners();
          res.send("Ok")
        },
      );
    }
  } catch (e) {
    res.send(`Bad Request`);
  }
});

// utils

function decryptText(encryptedText) {
  return crypto.privateDecrypt(
    {
      key: privateKey,
    },
    Buffer.from(encryptedText, "base64")
  );
}