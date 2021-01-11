const express = require('express');
const bodyParser = require('body-parser');
const Web3 = require('web3');
const config = require('./config.json');
const abiDecoder = require('abi-decoder');
require('dotenv').config()


const walletPrivateKey = process.env.WALLET_PRIVATE_KEY;

const web3 = new Web3('https://rinkeby.infura.io/v3/'+ process.env.INFURA_API_KEY);

web3.eth.accounts.wallet.add(walletPrivateKey);
const myWalletAddress = web3.eth.accounts.wallet[0].address;

const contractAddress = config.contractAddress;
const contractAbi = config.contractAbi;
const contract = new web3.eth.Contract(contractAbi,contractAddress);
abiDecoder.addABI(contractAbi);

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.route('/eth/api/v1/transaction/:txHash').get((req, res) => {
    web3.eth.getTransaction(req.params.txHash).then((result) => {
        // console.log(result);

        return res.json({
            "block": {
                "blockHeight": result.blockNumber
            },
            "outs" : [{
                "address" : result.to,
                "value" : "+"+result.value
            }],
            "ins" : [{
                "address" : result.from,
                "value" : "-"+result.value
            }],
            "hash": result.hash,
            "state": result.status,            
        });
    }).catch((error) => {
        console.error('Error:', error);
        return res.sendStatus(400);
    });
});

app.route('/eth/api/v1/erc20/transaction/:txHash').get((req, res) => {
    
    web3.eth.getTransaction(req.params.txHash).then((result) => {
        var value = decodeInput(result);
        return res.json({
            "block": {
                "blockHeight": result.blockNumber
            },
            "outs" : [{
                "address" : result.to,
                "value" : "+"+value,
                "coinspecific": {
                    "tokenAddress": ""
                    }
            }],
            "ins" : [{
                "address" : result.from,
                "value" : "-"+value,
                "coinspecific": {
                    "tokenAddress": ""
                    }
            }],
            "hash": result.hash,
            "state": result.status,
            
        });
    }).catch((error) => {
        console.error('Error:', error);
        return res.sendStatus(400);
    });
});

function decodeInput(result) {	
    input = abiDecoder.decodeMethod(result.input);
    params = input.params;

    const filteredArray = params.reduce((a, o) => (o.name=="_value" && a.push(o.value), a), []) 
    return filteredArray[0];
  }

app.listen(port, () => console.log(`API server running on port ${port}`));




