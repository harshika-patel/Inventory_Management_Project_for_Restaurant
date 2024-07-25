const request = require('supertest');
const app = require('../index'); // Assuming your Express app is exported as 'app'

describe('Delete Employee API', () => {
    let cookie; // Variable to store the session cookie
    let employeeId; // Variable to store the ID of the employee to be deleted

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
        it('should add a new employee', async () => {
            const newEmployeeData = {
                name: 'Tej Patel',
                email: 'johndoe@example.com'
            };
    
            const res = await request(app)
                .post('/addEmployee')
                .set('Cookie', cookie)
                .send(newEmployeeData);
    
            expect(res.status).toBe(201);
            expect(res.text).toBe('Employee added successfully');
    });

    it('should delete an employee', async () => {
        employeeId='65edf2a319db682863ba6f6a';//put actual emp id 
        const res = await request(app)
            .delete(`/deleteEmployee/${employeeId}`)
            .set('Cookie', cookie);

        expect(res.status).toBe(200);
        expect(res.text).toBe('Employee deleted successfully');
    });

    // Logout after running tests
    afterAll(async () => {
        await request(app)
            .get('/logout')
            .set('Cookie', cookie);
    });
});

