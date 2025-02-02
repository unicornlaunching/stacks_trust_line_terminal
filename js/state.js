class State {
    constructor() {
        this.accounts = new Map();
        this.trustlines = new Map();
        this.currentAccount = null;
    }

    createAccount(address, balance = "0") {
        this.accounts.set(address, {
            address,
            balance,
            trustlines: new Set()
        });
        return this.accounts.get(address);
    }

    getAccount(address) {
        return this.accounts.get(address);
    }

    setCurrentAccount(address) {
        if (!this.accounts.has(address)) {
            throw new Error("Account does not exist");
        }
        this.currentAccount = address;
    }
}

const state = new State(); 