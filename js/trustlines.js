// Single source of truth for trust line management
const TrustLineManager = (() => {
    // Private state reference
    let stateRef = null;

    // Private methods
    const validateTrustLine = (from, to, currency, limit) => {
        if (!from || !to || !currency || !limit) {
            throw new Error('Missing required parameters');
        }
        if (!stateRef.accounts.has(from) || !stateRef.accounts.has(to)) {
            throw new Error('One or both accounts do not exist');
        }
        if (from === to) {
            throw new Error('Cannot create trust line to self');
        }
    };

    const createTrustLineObject = (from, to, currency, limit) => ({
        from,
        to,
        currency,
        limit: limit.toString(),
        balance: "0"
    });

    // Public API
    class Manager {
        constructor(state) {
            if (!state) {
                throw new Error('State is required');
            }
            stateRef = state;
        }

        createTrustLine(from, to, currency, limit) {
            validateTrustLine(from, to, currency, limit);
            
            const key = `${from}-${to}-${currency}`;
            if (stateRef.trustlines.has(key)) {
                throw new Error('Trust line already exists');
            }

            const trustLine = createTrustLineObject(from, to, currency, limit);
            stateRef.trustlines.set(key, trustLine);
            stateRef.accounts.get(from).trustlines.add(key);
            
            return trustLine;
        }

        getTrustLine(from, to, currency) {
            const key = `${from}-${to}-${currency}`;
            return stateRef.trustlines.get(key);
        }

        getBalance(account, currency) {
            let total = 0;
            for (const [key, trustLine] of stateRef.trustlines) {
                if (trustLine.from === account && trustLine.currency === currency) {
                    total += Number(trustLine.balance);
                }
                if (trustLine.to === account && trustLine.currency === currency) {
                    total -= Number(trustLine.balance);
                }
            }
            return total.toString();
        }

        updateBalance(from, to, currency, amount) {
            const trustLine = this.getTrustLine(from, to, currency);
            if (!trustLine) {
                throw new Error('Trust line not found');
            }

            const newBalance = Number(trustLine.balance) + Number(amount);
            if (newBalance > Number(trustLine.limit)) {
                throw new Error('Would exceed trust line limit');
            }

            trustLine.balance = newBalance.toString();
            return trustLine;
        }
    }

    return Manager;
})();

// Export for use in other modules
window.TrustLineManager = TrustLineManager;
