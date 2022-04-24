const {block} = require('./block.js')
const {transaction} = require('./transaction')

class blockchain{
    constructor(difficulty = 4 , miningReward = 10 , default_balance = 1){
        this.chain = [this.createGenesisBlock()]
        this.pendingTransactions = []
        this.difficulty = difficulty
        this.miningReward = miningReward
        this.default_balance = default_balance
    }

    addUser(_user){
        const tx = new transaction(null , _user.getPubKey() , this.default_balance)
        this.pendingTransactions.push(tx)
    }

    addUsers(_users){
        for (const user of _users)
            this.addUser(user)
    }

    createGenesisBlock(){
        return new block(Date.parse('2022-01-01') , [] , '0')
    }

    getLatestBlock(){
        return this.chain[this.chain.length - 1]
    }

    minePendingTransactions(miningRewardAddr){
        const rewardTx = new transaction(null , miningRewardAddr , this.miningReward)
        this.pendingTransactions.push(rewardTx)

        const blk = new block(Date.now() , this.pendingTransactions, this.getLatestBlock().hash)
        blk.mineBlock(this.difficulty)

        this.chain.push(blk)
        this.pendingTransactions = []
    }

    addTransaction(transaction){
        if(!transaction.fromAddr || !transaction.toAddr)
            throw new Error("Transactions must have from and to address")
        if(!transaction.isValid())
            throw new Error("Cannot add invalid transactions")
        if(transaction.amt <= 0)
            throw new Error("Transaction amount must be greater than 0")    
        
        const bal = this.getBalOfAddr(transaction.fromAddr)
        if(bal < transaction.amt)
            throw new Error("Not enough balance")
        
        const pendingTxForWallet = this.pendingTransactions.filter(tx => tx.fromAddr == transaction.fromAddr)    

        if(pendingTxForWallet.length > 0){
            const totalPendingAmt = pendingTxForWallet.map(tx => tx.amt).reduce((prev , curr) => prev + curr)
            const totalAmt = totalPendingAmt + transaction.amt
            if(totalAmt > bal)
                throw new Error("Pending transactions for this wallet is higher than its balance")
        }
        this.pendingTransactions.push(transaction)
    }

    getBalOfAddr(addr){
        let balance = 0

        for(const block of this.chain){
            for(const trans of block.transactions){
                if(trans.fromAddr == addr)
                    balance -= trans.amt
                if(trans.toAddr == addr)
                    balance += trans.amt
            }
        }
        return balance
    }

    getTransOfAddr(addr){
        const txs = []
        for(const blk in this.chain){
            for(const tx in blk.transactions){
                if(tx.fromAddr == addr || tx.toAddr == addr)
                    txs.push(tx)
            }
        }
        return txs
    }

    isChainValid(){
        const genesis = JSON.stringify(this.createGenesisBlock())
        if(genesis != JSON.stringify(this.chain[0]))
            return false
        for(let i = 1; i < this.chain.length; i++){

            const curr = this.chain[i]
            const prev = this.chain[i - 1]

            if(curr.prevHash != prev.hash)
                return false
            if(!curr.hasValidTransactions())
                return false

            if(curr.calculateHash() !== curr.hash)
                return false

            if(curr.hash.substring(0 , this.difficulty) !== Array(this.difficulty + 1).join('0'))
                return false
        }
        return true
    }
}

module.exports.blockchain = blockchain