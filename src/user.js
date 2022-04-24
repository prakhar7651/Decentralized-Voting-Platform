const { transaction } = require('./transaction')

const EC = require('elliptic').ec
const ec = new EC('secp256k1')

class User{
    constructor(name){
        this.name = name
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
