console.log('server-side code running')

const express = require('express')
const bodyParser = require('body-parser')
const app = express()

app.use(bodyParser.urlencoded({extended : true}))

const { blockchain } = require('./src/blockchain')
const { User } = require('./src/user')

let somuCoin = new blockchain()

Somu = new User('Somu')
Ananya = new User('Ananya')
Mummy = new User('Mummy')
Papa = new User('Papa')

tx_list = [
    Somu.sendMoney(Ananya , 10),
    Ananya.sendMoney(Somu , 5),
    Papa.sendMoney(Somu , 30)
]

for(const tx of tx_list){
    somuCoin.addTransaction(tx)
}

somuCoin.minePendingTransactions(Mummy.getPubKey())
console.log(JSON.stringify(somuCoin , null , 2))
console.log(somuCoin.isChainValid())

console.log(somuCoin.getBalOfAddr(Somu.getPubKey()))
console.log(somuCoin.getBalOfAddr(Ananya.getPubKey()))
console.log(somuCoin.getBalOfAddr(Mummy.getPubKey()))
console.log(somuCoin.getBalOfAddr(Papa.getPubKey()))




