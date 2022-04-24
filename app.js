console.log('server-side code running')

const mongoose = require('mongoose')
const express = require('express')
const bodyParser = require('body-parser')

const app = express()
app.use(bodyParser.urlencoded({extended : true}))

const { blockchain } = require('./src/blockchain')
const { User } = require('./src/user')

const URL = 'mongodb://localhost:27017'
const dbName = 'BITS-Voting'
const PORT = 3000

mongoose.connect(URL + '/' + dbName)
const candidateSchema = new mongoose.Schema({
    name: String,
    phone_no : Number,
    description: String,
    loc : String
})
const Candidate = mongoose.model('Candidate' , candidateSchema)

const userSchema = new mongoose.Schema({
    user_obj : Object
})


let somuCoin = new blockchain()


voters = [
    new User('7651886038'), // prakhar
    new User('8081452254'), //vedansh
    new User('9305073399'), //jeevan
    new User('7507626699'), //saraf
    new User('9168875988')  //jain
]

somuCoin.addUsers(voters)

candidates = [
    new User('9663644558'), //Hriday G
    new User('9039051015')  //Anand
]

somuCoin.addUsers(candidates)

app.listen(PORT , () => {
    console.log(`App listening at port ${PORT}`)
})

app.get('/' , (req , res) => {
    res.send('Hello World')
})



// tx_list = [
//     Somu.sendMoney(Ananya , 10),
//     Ananya.sendMoney(Somu , 5),
//     Papa.sendMoney(Somu , 30)
// ]

// for(const tx of tx_list){
//     somuCoin.addTransaction(tx)
// }

// somuCoin.minePendingTransactions(Mummy.getPubKey())
// console.log(JSON.stringify(somuCoin , null , 2))
// console.log(somuCoin.isChainValid())

// console.log(somuCoin.getBalOfAddr(Somu.getPubKey()))
// console.log(somuCoin.getBalOfAddr(Ananya.getPubKey()))
// console.log(somuCoin.getBalOfAddr(Mummy.getPubKey()))
// console.log(somuCoin.getBalOfAddr(Papa.getPubKey()))




