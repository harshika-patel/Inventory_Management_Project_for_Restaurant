require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');


const app = express();
app.use(bodyParser.json());
app.set('view engine', 'ejs');


// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/myapp', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
   
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));



// User Schema
const User = mongoose.model('User', new mongoose.Schema({
    email: String,
    password: String
}));
const employeeSchema = new mongoose.Schema({
    name: String,
    email: String
  });
  const Employee = mongoose.model('Employee', employeeSchema);

  // Route to get employee data
app.get('/getEmployees', async (req, res) => {
    try {
        const employees = await Employee.find({}, 'name email');
        res.json(employees);
    } catch (err) {
        console.error('Error fetching employee data:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Route to add employee
app.post('/addEmployee', async (req, res) => {
    const { name, email } = req.body;
    try {
        const newEmployee = new Employee({ name, email });
        await newEmployee.save();
        res.status(201).send('Employee added successfully');
    } catch (err) {
        console.error('Error adding employee:', err);
        res.status(500).send('Internal Server Error');
    }
});



// DELETE route to delete an employee
app.delete('/deleteEmployee/:id', (req, res) => {
    const employeeId = req.params.id;
    
    // Check if the employeeId is valid
    if (!employeeId) {
        return res.status(400).send('Employee ID is required');
    }

    // Delete the employee from the database
    Employee.findByIdAndDelete(employeeId)
        .then(deletedEmployee => {
            if (!deletedEmployee) {
                return res.status(404).send('Employee not found');
            }
            res.send('Employee deleted successfully');
        })
        .catch(err => {
            console.error('Error deleting employee:', err);
            res.status(500).send('Failed to delete employee');
        });
});



// Inventory Schema
const InventoryItem = mongoose.model('InventoryItem', new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    item: String,
    quantity: Number
}));

// Shift model definition
const shiftSchema = new mongoose.Schema({
    
    userId: String,
    day: String,
    startTime: String,
    endTime: String,
    duties: String,
    employeeName:String
    // Other shift fields...
  });

  const Shift = mongoose.model('Shift', shiftSchema);
  app.use(express.json());
  const ObjectId = mongoose.Types.ObjectId;

app.post('/shifts', (req, res) => {
    // Generate a new ObjectId for the user id
    const userId = new ObjectId();

    // Assuming you're using Mongoose for database operations
    const newShift = new Shift({
        userId: userId,
        day: req.body.day,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        duties: req.body.duties,
        employeeName:req.body.employeeName
    });

    newShift.save()
        .then(savedShift => {
            // Send the saved shift data back as a JSON response
            res.status(201).json(savedShift);
        })
        .catch(error => {
            console.error('Error saving shift:', error);
            res.status(500).json({ error: 'Failed to save shift' });
        });
});
// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ secret: 'secret', resave: true, saveUninitialized: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/home', (req, res) => {
    // Assuming home.html is in the public directory
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Route to serve the viewEmployees.html file
app.get('/viewEmployees', (req, res) => {
    res.sendFile(path.join(__dirname,'public', 'viewEmployees.html'));
});
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            // If user doesn't exist, send error message
            return res.send('Email or password is incorrect');
        }

        // Check if password is correct
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            // If password doesn't match, send error message
            return res.send('Email or password is incorrect');
        }

        // If both email and password are correct, store email in session and redirect to home page
         req.session.email = email;
         res.redirect('/home');
        // Retrieve shift data for the user
        // const shifts = await Shift.find({ userId: user._id });
        // return res.status(200).send({ user, shifts });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send('An error occurred while logging in');
    }
});

app.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            // If email exists, send error message
            return res.send('User with this email already exists');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        await User.create({ email, password: hashedPassword });

        // Store email in session and redirect to home page
        req.session.email = email;
        res.redirect('/home');
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('An error occurred while registering user');
    }
});


app.post('/add-item', async (req, res) => {
    if (!req.session.email) {
        return res.redirect('/');
    }

    const { itemName, itemQuantity } = req.body;

    try {
        const user = await User.findOne({ email: req.session.email });
        await InventoryItem.create({ user, item: itemName, quantity: parseInt(itemQuantity) });

        res.json({ success: true });
    } catch (error) {
        console.error('Error adding item:', error);
        res.status(500).json({ success: false, message: 'Failed to add item' });
    }
});

app.get('/inventory', async (req, res) => {
    if (!req.session.email) {
        return res.redirect('/');
    }

    try {
        const user = await User.findOne({ email: req.session.email });
        const inventoryItems = await InventoryItem.find({ user });

        res.json(inventoryItems);
    } catch (error) {
        console.error('Error fetching inventory items:', error);
        res.status(500).send('Error fetching inventory items');
    }
});

app.post('/update-quantity', async (req, res) => {
    if (!req.session.email) {
        return res.redirect('/');
    }

    const { itemId, delta } = req.body;

    try {
        const inventoryItem = await InventoryItem.findById(itemId);
        inventoryItem.quantity += parseInt(delta);
        await inventoryItem.save();

        res.sendStatus(200);
    } catch (error) {
        console.error('Error updating quantity:', error);
        res.status(500).send('Error updating quantity');
    }
});

// Create a Nodemailer transporter
const transporter = nodemailer.createTransport({
    host:'smtp.gmail.com',
    port:465,
    secure:true,
    auth: {
        user: `test2574app@gmail.com`, // Your Gmail address
        pass: `legbsjlvkmjodzsi`// Your Gmail password
    }
});

app.post('/generate-mail', async (req, res) => {
    try {
        // const { email } = req.session; // Get the user's email from the session
        const user = await User.findOne({ email: req.session.email });
        // Fetch all past inventory items for the logged-in user
        const inventoryItems = await InventoryItem.find({ user });
        // Render home page and pass inventory items data to the client

        
        // Check inventory items
        const lowInventoryItems = inventoryItems.filter(item => item.quantity <= 3);
        
        if (lowInventoryItems.length > 0) {
            // Construct email message with the list of low inventory items
            const emailMessage = lowInventoryItems.map(item => `Item: ${item.item}, Quantity: ${item.quantity}`).join('\n');

            // Send email
            const mailOptions = {
                from: 'your-email@gmail.com', // Sender's email address
                to: req.session.email,
                subject: 'Low Inventory Alert',
                text: emailMessage
            };
            await transporter.sendMail(mailOptions);
        }
            

        res.send('Mail sent successfully'); // Send response to client
        res.sendFile(path.join(__dirname, 'public', 'home.html'));
        } 
    
    catch (error) {
        console.error('Error sending email:', error);
        res.status(500).send('Error sending email');
    }
});

app.post('/delete-item', async (req, res) => {
    const itemId = req.body.itemId; // Assuming you're sending itemId in the request body

    try {
        // Delete the item from the database using its _id
        await InventoryItem.findByIdAndDelete(itemId);
        
        res.send({ success: true, message: 'Item deleted successfully' });
    } catch (error) {
        console.error(error);
        res.send({ success: false, message: 'Failed to delete item' });
    }
});





// Route to send shift emails based on date range
app.post('/send-shift-emails', async (req, res) => {
    const { startDate, endDate } = req.body;

    try {
        // Fetch shifts data within the specified date range
        const shifts = await Shift.find({ day: { $gte: startDate, $lte: endDate } });

        // Fetch email addresses of employees
        const employees = await Employee.find({}, 'email');

        // Extract email addresses from employee data
        const emails = employees.map(employee => employee.email);

        // Send emails to employees with shift details
        sendEmails(emails, shifts);

        res.status(200).send('Shift emails sent successfully');
    } catch (error) {
        console.error('Error sending shift emails:', error);
        res.status(500).send('Failed to send shift emails');
    }
});

// Function to send emails to employees
function sendEmails(emails, shifts) {
    const mailOptions = {
        from: 'your-email@gmail.com',
        to: emails.join(','),
        subject: 'Shift Details',
        html: `<p>Shift Details:</p>
            <table>
                <thead>
                    <tr>
                        <th>Employee Name</th>
                        <th>Day</th>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Duties</th>
                    </tr>
                </thead>
                <tbody>
                    ${shifts.map(shift => `
                        <tr>
                            <td>${shift.employeeName}</td>
                            <td>${shift.day}</td>
                            <td>${shift.startTime}</td>
                            <td>${shift.endTime}</td>
                            <td>${shift.duties}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
}
// Route to generate table for a specific employee
app.post('/generate-table', async (req, res) => {
    const employeeId = req.body.employeeId; // Assuming you're sending employeeId in the request body

    try {
        // Fetch shift data for the specified employee
        const shifts = await Shift.find({ userId: employeeId });

        // Render table template with shift data
        res.render('shiftTable', { shifts });
    } catch (error) {
        console.error('Error fetching shift data:', error);
        res.status(500).send('Error fetching shift data');
    }
});



const server=app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
module.exports = server;
app.use(bodyParser.json());

