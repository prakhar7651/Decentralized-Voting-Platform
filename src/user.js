const { transaction } = require('./transaction')

const mongoose = require('mongoose')
const EC = require('elliptic').ec
const ec = new EC('secp256k1')

const URL = 'mongodb://localhost:27017'
const dbName = 'BITS-Voting'

const _userSchema = new mongoose.Schema({
    phone_no : Number,
    pub_key : String
})
const _user = mongoose.model('_user' , _userSchema)



class User{
    constructor(_phone){
        this.phone_np = _phone

        mongoose.connect(URL + '/' + dbName)

        const key = ec.genKeyPair()

        this.getPubKey = () => {
            return key.getPublic('hex')
        }

        this.signTransaction = (tx) => {
            if(this.getPubKey() !== tx.fromAddr)
                throw new Error('You cannot sign transactions for other wallets')
            const hashTx = tx.calculateHash()
            const sig = key.sign(hashTx , 'base64')
            tx.signature = sig.toDER('hex')
        }

        this.sendMoney = (user , amt) => {
            const tx = new transaction(this.getPubKey() , user.getPubKey() , amt)
            this.signTransaction(tx)
            return tx
        }

    }
}

module.exports.User = User
