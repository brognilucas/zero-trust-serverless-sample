class FakeDatabase {
    users = new Map();
    mfaCodes = new Map();
    
    constructor() {
    }

    async createUser(email, passwordHash) {
        if (this.users.has(email)) {
            const error = new Error('User already exists');
            error.name = 'ConditionalCheckFailedException';
            throw error;
        }
        this.users.set(email, { passwordHash });
    }

    async getUser(email) {
        return this.users.get(email);
    }

    async setMfaCode(email, mfaCode) {
        const ttl = Math.floor(Date.now() / 1000) + 300; // 5 minutes TTL
        this.mfaCodes.set(email, { mfaCode, ttl: ttl.toString() });
    }

    async getMfaCode(email) {
        return this.mfaCodes.get(email);
    }

    async deleteMfaCode(email) {
        this.mfaCodes.delete(email);
    }
}

export default FakeDatabase;