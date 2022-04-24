const SHA256 = require('crypto-js/sha256')
const EC = require('elliptic').ec
const ec = new EC('secp256k1')

class transaction{
    constructor(fromAddr , toAddr , amt){
        this.fromAddr = fromAddr
        this.toAddr = toAddr
        this.amt = amt
    }

    calculateHash(){
        return SHA256(this.fromAddr + this.toAddr + this.amt).toString()
    }
    
    isValid(){
        if(this.fromAddr == null && this.toAddr != null)
            return true
        if(!this.signature || this.signature.length == 0)
            return false

        const pubKey = ec.keyFromPublic(this.fromAddr , 'hex')
        return pubKey.verify(this.calculateHash() , this.signature)
    }

}

module.exports.transaction = transaction