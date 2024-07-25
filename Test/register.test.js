const request = require('supertest');
const app = require('../index');

describe('Registration endpoint', () => {
    test('Register with valid credentials', async () => {
        const response = await request(app)
            .post('/register')
            .send({
                email: 'test@example.com',
                password: 'test123',
                confirm_password: 'test123',
                restaurant_name: 'Test Restaurant',
                phone_number: '1234567890'
            });

        // Assert that the response status code is 200 (redirect)
        expect(response.status).toBe(200);
    });

    test('Register with invalid credentials', async () => {
        const response = await request(app)
            .post('/register')
            .send({
                email: 'harshikapatel2574@gmail.com', // Assume this email already exists in the database
                password: 'test123',
                confirm_password: 'test123',
                restaurant_name: 'Test Restaurant',
                phone_number: '1234567890'
            });

        // Assert that the response status code is 200 (indicating failure)
        expect(response.status).toBe(200);
    });
});
