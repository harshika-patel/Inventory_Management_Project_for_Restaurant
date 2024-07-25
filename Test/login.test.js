const request = require('supertest');
const app = require('../index'); // Assuming your Express app file is named index.js

describe('Login endpoint', () => {
    test('Login with valid credentials', async () => {
        const response = await request(app)
            .post('/login')
           
            .send({ email: 'harshikapatel2574@gmail.com', password: 'admin' });


        expect(response.status).toBe(302); // Assuming successful login returns a 200 status code
    },10000);

    test('Login with invalid credentials', async () => {
        const response = await request(app)
            .post('/login')
            .send({ email: 'harshikapatel2574@gmail.com', password: 'admin123' });

        expect(response.status).toBe(200); // Assuming invalid login returns a 401 status code
    },10000);
});
