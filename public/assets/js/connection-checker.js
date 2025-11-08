class ConnectionChecker {
    constructor(apiClient, onStatusChange) {
        this.apiClient = apiClient;
        this.onStatusChange = onStatusChange;
        this.isConnected = false;
        this.checkInterval = null;
        this.setupListeners();
    }

    setupListeners() {
        window.addEventListener('online', () => this.checkConnection());
        window.addEventListener('offline', () => {
            this.isConnected = false;
            this.onStatusChange(false);
        });
    }

    async checkConnection() {
        try {
            const response = await fetch(this.apiClient.baseUrl + '/api/health', {
                method: 'GET',
                cache: 'no-cache'
            });
            
            const wasConnected = this.isConnected;
            this.isConnected = response.ok;
            
            if (wasConnected !== this.isConnected) {
                this.onStatusChange(this.isConnected);
            }
            
            return this.isConnected;
        } catch (error) {
            this.isConnected = false;
            this.onStatusChange(false);
            return false;
        }
    }

    startChecking(interval = 30000) {
        this.checkConnection();
        this.checkInterval = setInterval(() => this.checkConnection(), interval);
    }

    stopChecking() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
}