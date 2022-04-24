const SHA256 = require('crypto-js/sha256')

class block{
    constructor(timestamp , transactions , prevHash){
        this.timestamp = timestamp
        this.transactions = transactions
        this.prevHash = prevHash
        this.nonce = 0
        this.hash = this.calculateHash()
    }

    calculateHash(){
        return SHA256(this.timestamp + JSON.stringify(this.transactions) + this.prevHash + this.nonce).toString()
    }

    mineBlock(difficulty){
        while(this.hash.substring(0 , difficulty) !== Array(difficulty + 1).join('0')){
            this.nonce++
            this.hash = this.calculateHash()
        }
    }

    hasValidTransactions(){
        for(const tx of this.transactions){
            if(!tx.isValid())
                return false
        }
        return true
    }
}

module.exports.block = block