const request = require('supertest');
const app = require('../index'); // Assuming your Express app entry point file is named index.js

describe('Inventory Management', () => {
    let cookie; // Variable to store the session cookie

    // Login before running tests
    beforeAll(async () => {
        const res = await request(app)
            .post('/login')
            .send({
                email: 'harshikapatel2574@gmail.com', // Provide your test user credentials
                password: 'admin'
            });

        cookie = res.headers['set-cookie'];
    });

    it('should add an inventory item', async () => {
        const res = await request(app)
            .post('/add-item')
            .set('Cookie', cookie)
            .send({
                itemName: 'Test Item',
                itemQuantity: 10
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        // Save the item id for later use in other test cases
        itemId = res.body.itemId;
    });

    it('should increase item quantity', async () => {
        const res = await request(app)
            .post('/update-quantity')
            .set('Cookie', cookie)
            .send({
                itemId:'65ceecb844e7dab4e12dfa57', // Provide a valid itemId to update quantity
                delta: 5 // Increase quantity by 5
            });

        expect(res.status).toBe(200);
    });

    it('should decrease item quantity', async () => {
        const res = await request(app)
            .post('/update-quantity')
            .set('Cookie', cookie)
            .send({
                itemId: '65ceecb844e7dab4e12dfa57', // Provide a valid itemId to update quantity
                delta: -3 // Decrease quantity by 3
            });

        expect(res.status).toBe(200);
    });

    it('should generate mail', async () => {
        const res = await request(app)
            .post('/generate-mail')
            .set('Cookie', cookie)
            .send();

        expect(res.status).toBe(200);
        expect(res.text).toBe('Mail sent successfully');
    });

    it('should delete an inventory item', async () => {
        const res = await request(app)
            .post('/delete-item')
            .set('Cookie', cookie)
            .send({
                itemId: '65ceecad44e7dab4e12dfa50' // Provide a valid itemId to delete
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    // Logout after running tests
    afterAll(async () => {
        await request(app)
            .get('/logout')
            .set('Cookie', cookie)
            .send();
    });
});
