class Terminal {
    constructor() {
        console.log('Starting Terminal constructor');
        try {
            this.terminal = document.getElementById('terminal');
            this.input = document.getElementById('cmd-input');
            
            if (!this.terminal || !this.input) {
                console.error('DOM elements not found:', {
                    terminal: this.terminal,
                    input: this.input
                });
                throw new Error('Required DOM elements not found');
            }

            // Initialize managers
            this.trustLineManager = new window.TrustLineManager(state);
            this.paymentEngine = new PaymentEngine(state, this.trustLineManager);
            
            this.commandHistory = [];
            this.historyIndex = -1;

            // Setup commands directly in constructor
            this.commands = {
                help: () => this.showHelp(),
                clear: () => this.clear(),
                create_account: (args) => this.createAccount(args),
                use_account: (args) => this.useAccount(args),
                create_trustline: (args) => this.createTrustLine(args),
                show_accounts: () => this.showAccounts(),
                show_trustlines: () => this.showTrustLines(),
                batch_create_accounts: (args) => this.batchCreateAccounts(args),
                batch_create_trustlines: (args) => this.batchCreateTrustlines(args),
                current_account: () => this.showCurrentAccount(),
                send_payment: (args) => this.sendPayment(args),
                check_balance: (args) => this.checkBalance(args),
                list_accounts: () => this.listAccounts()
            };

            this.setupEventListeners();
            
            this.print("Welcome to Stacks Trust Line Simulator");
            this.print("Keep Shit Outcha Wallet");
            this.print("SIP-03X");
            this.print("@attractfund1ng");
            this.print("--------------------------------"); 
            this.print("Type 'help' to see available commands");
            console.log('Terminal initialized with commands:', Object.keys(this.commands));
        } catch (error) {
            console.error('Terminal initialization failed:', error);
            this.handleError(error);
        }
    }

    setupEventListeners() {
        console.log('Setting up keypress listener');
        this.input.addEventListener('keypress', (e) => {
            console.log('Key pressed:', e.key, 'Current input:', this.input.value);
            if (e.key === 'Enter') {
                console.log('Enter key pressed');
                const cmd = this.input.value.trim();
                console.log('Command to execute:', cmd);
                if (cmd) {
                    try {
                        console.log('Attempting to execute command:', cmd);
                        this.executeCommand(cmd);
                    } catch (error) {
                        console.error('Command execution failed:', error);
                        this.handleError(error);
                    }
                    this.commandHistory.push(cmd);
                    this.historyIndex = this.commandHistory.length;
                    this.input.value = '';
                }
                e.preventDefault();
            }
        });
        console.log('Keypress listener set up');
    }

    executeCommand(cmdString) {
        console.log('executeCommand called with:', cmdString);
        this.print(`$ ${cmdString}`, 'prompt');
        const [cmd, ...args] = cmdString.split(' ');
        console.log('Parsed command:', { cmd, args });

        console.log('Available commands:', Object.keys(this.commands));
        if (this.commands[cmd]) {
            console.log('Command found, executing:', cmd);
            try {
                this.commands[cmd](args);
            } catch (error) {
                console.error('Command execution failed:', error);
                this.handleError(error);
            }
        } else {
            console.log('Unknown command:', cmd);
            this.print(`Unknown command: '${cmd}'. Type 'help' for available commands.`, 'error');
        }
    }

    handleError(error) {
        console.error('Terminal error:', error);
        console.error('Error stack:', error.stack);
        this.print(`Error: ${error.message}`, 'error');
    }

    print(message, type = 'response') {
        console.log('Printing message:', { message, type });
        try {
            let line;
            if (type === 'help') {
                line = document.createElement('pre');
            } else {
                line = document.createElement('div');
            }
            line.className = type;
            line.textContent = message;
            this.terminal.appendChild(line);
            this.terminal.scrollTop = this.terminal.scrollHeight;
            console.log('Message printed successfully');
        } catch (error) {
            console.error('Failed to print message:', error);
        }
    }

    clear() {
        this.terminal.innerHTML = '';
    }

    createAccount(args) {
        const [address, balance] = args;
        if (!address) {
            throw new Error('Address is required');
        }
        state.createAccount(address, balance || "0");
        this.print(`Created account: ${address}`);
    }

    useAccount(args) {
        const [address] = args;
        if (!address) {
            throw new Error('Address is required');
        }
        state.setCurrentAccount(address);
        this.print(`Now using account: ${address}`);
    }

    createTrustLine(args) {
        const [to, currency, limit] = args;
        if (!state.currentAccount) {
            throw new Error("No account selected. Use 'use_account' first");
        }
        if (!to || !currency || !limit) {
            throw new Error("Required: <to> <currency> <limit>");
        }
        
        const trustLine = this.trustLineManager.createTrustLine(
            state.currentAccount,
            to,
            currency,
            limit
        );
        this.print(`Created trust line: ${JSON.stringify(trustLine, null, 2)}`);
    }

    showAccounts() {
        const accounts = Array.from(state.accounts.entries());
        this.print(JSON.stringify(accounts, null, 2));
    }

    showTrustLines() {
        if (!state.currentAccount) {
            throw new Error("No account selected. Use 'use_account' first");
        }
        const account = state.getAccount(state.currentAccount);
        const trustLines = Array.from(account.trustlines)
            .map(key => state.trustlines.get(key));
        this.print(JSON.stringify(trustLines, null, 2));
    }

    batchCreateAccounts(args) {
        const [count] = args;
        const num = parseInt(count) || 10;
        
        for (let i = 0; i < num; i++) {
            const address = `account${i}`;
            state.createAccount(address, "1000");
            this.print(`Created account: ${address}`);
        }
    }

    batchCreateTrustlines(args) {
        const [fromPattern, toPattern, currency, limit, count] = args;
        if (!fromPattern || !toPattern || !currency || !limit || !count) {
            throw new Error("Required: <from_pattern> <to_pattern> <currency> <limit> <count>");
        }

        const num = parseInt(count);
        for (let i = 0; i < num; i++) {
            const from = fromPattern.replace('*', i);
            for (let j = 0; j < num; j++) {
                if (i === j) continue;
                const to = toPattern.replace('*', j);
                try {
                    this.trustLineManager.createTrustLine(from, to, currency, limit);
                    this.print(`Created trust line: ${from} -> ${to} (${currency})`);
                } catch (error) {
                    this.print(`Failed to create trust line ${from} -> ${to}: ${error.message}`, 'error');
                }
            }
        }
    }

    showCurrentAccount() {
        if (state.currentAccount) {
            this.print(`Currently using account: ${state.currentAccount}`);
        } else {
            this.print("No account selected", 'error');
        }
    }

    sendPayment(args) {
        const [to, currency, amount] = args;
        if (!state.currentAccount) {
            throw new Error("No account selected. Use 'use_account' first");
        }
        if (!to || !currency || !amount) {
            throw new Error("Required: <to> <currency> <amount>");
        }

        const result = this.paymentEngine.executePayment(state.currentAccount, to, currency, amount);
        this.print(`Payment successful: ${JSON.stringify(result, null, 2)}`);
    }

    checkBalance(args) {
        const [currency] = args;
        if (!state.currentAccount) {
            throw new Error("No account selected. Use 'use_account' first");
        }
        if (!currency) {
            throw new Error("Required: <currency>");
        }

        const balance = this.trustLineManager.getBalance(state.currentAccount, currency);
        this.print(`Balance for ${currency}: ${balance}`);
    }

    showHelp() {
        const helpDiv = document.createElement('pre');
        helpDiv.className = 'help-text';
        helpDiv.textContent = `
┌─────────────────────────────────────────────────────────────────┐
│                     Available Commands                          │
└─────────────────────────────────────────────────────────────────┘

Basic Commands:
  help                     Show this help message
  clear                    Clear terminal
  current_account          Show current account
  list_accounts            List all accounts

Account Management:
  create_account <address> [balance]      
    Create new account with optional initial balance
  
  use_account <address>    
    Switch to using specified account

Trust Lines:
  create_trustline <to> <currency> <limit>
    Create trust line from current account to specified account
  
  show_trustlines         
    Show current account's trust lines
  
  show_accounts           
    List all accounts and their details

Batch Operations:
  batch_create_accounts <count>
    Create multiple accounts automatically
  
  batch_create_trustlines <from> <to> <currency> <limit> <count>
    Create multiple trust lines between accounts

Payment Operations:
  send_payment <to> <currency> <amount>
    Send payment to specified account
  
  check_balance <currency>
    Check current account's balance for specified currency

Type a command and press Enter to execute.
Example: create_account alice 1000`;

        this.terminal.appendChild(helpDiv);
        this.terminal.scrollTop = this.terminal.scrollHeight;
    }

    listAccounts() {
        const accounts = Array.from(state.accounts.keys());
        this.print("Available accounts:");
        accounts.forEach(account => {
            const trustlines = state.accounts.get(account).trustlines.size;
            this.print(`${account} (${trustlines} trust lines)`);
        });
    }
}

class Validator {
    // Need to implement:
    validateCurrency(currency) {
        // Check ISO currency code format
        // Or validate hex currency code
    }

    validateTrustLineOperation(from, to, currency, amount, limit) {
        // Check all parameters
        // Verify account existence
        // Check for existing trust lines
    }
}

// Initialize terminal when page loads
console.log('Setting up load event listener');
window.addEventListener('load', () => {
    console.log('Page loaded, creating terminal instance');
    try {
        window.terminal = new Terminal();
        console.log('Terminal global instance created:', window.terminal);
    } catch (error) {
        console.error('Failed to create terminal instance:', error);
        console.error('Error stack:', error.stack);
        alert('Failed to initialize terminal. Check console for details.');
    }
});

console.log('Terminal.js loaded'); 