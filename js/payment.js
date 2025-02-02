class PaymentEngine {
    constructor(state, trustLineManager) {
        this.state = state;
        this.trustLineManager = trustLineManager;
    }

    validatePayment(from, to, currency, amount) {
        // Check if accounts exist
        if (!this.state.getAccount(from) || !this.state.getAccount(to)) {
            throw new Error("One or both accounts do not exist");
        }

        // Check if trust line exists
        const trustLine = this.trustLineManager.getTrustLine(from, to, currency);
        if (!trustLine) {
            throw new Error("No trust line exists between accounts for this currency");
        }

        // Convert amount to number for comparison
        const numAmount = Number(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            throw new Error("Invalid payment amount");
        }

        // Additional validations can be added here
        return true;
    }

    executePayment(from, to, currency, amount) {
        this.validatePayment(from, to, currency, amount);
        
        try {
            // Update trust line balance
            const updatedTrustLine = this.trustLineManager.updateBalance(from, to, currency, amount);
            
            return {
                success: true,
                from,
                to,
                currency,
                amount,
                newBalance: updatedTrustLine.balance
            };
        } catch (error) {
            throw new Error(`Payment failed: ${error.message}`);
        }
    }
} 