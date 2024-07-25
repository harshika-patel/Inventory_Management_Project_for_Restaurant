const request = require('supertest');
const app = require('../index');

describe('Shift Management', () => {
    let cookie; // Variable to store the session cookie
    let shiftId; // Variable to store the shift ID

    // Login before running tests
    beforeAll(async () => {
        const loginRes = await request(app)
            .post('/login')
            .send({
                email: 'harshikapatel2574@gmail.com',
                password: 'admin'
            });

        cookie = loginRes.headers['set-cookie'];
    });

    it('should add a shift', async () => {
        const res = await request(app)
            .post('/shifts')
            .set('Cookie', cookie)
            .send({
                day: 'Monday',
                startTime: '08:00',
                endTime: '16:00',
                duties: 'Some duties',
                employeeName: 'Hiral'
            });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('_id');
        shiftId = res.body._id; // Save the shift id for later use
    });

   
   
    it('should send shift emails for the specified date range', async () => {
        const startDate = '2024-03-01'; // Replace with your test start date
        const endDate = '2024-03-15'; // Replace with your test end date

        const res = await request(app)
            .post('/send-shift-emails')
            .set('Cookie', cookie)
            .send({
                startDate: startDate,
                endDate: endDate
               

            });

        expect(res.status).toBe(200);
        expect(res.text).toBe('Shift emails sent successfully');
    });

    // Logout after running tests
    afterAll(async () => {
        await request(app)
            .get('/logout')
            .set('Cookie', cookie);
    });
});
