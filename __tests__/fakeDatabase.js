
class FakeDatabase {
    users = new Map();
    
    constructor() {
    }

    async createUser(email, passwordHash) {
        if (this.users.has(email)) {
            const error = new Error('User already exists');
            error.name = 'ConditionalCheckFailedException';
            throw error;
        }
        this.users.set(email, passwordHash);
    }
}

export default FakeDatabase;