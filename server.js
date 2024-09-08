const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser'); // For parsing cookies
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');

// Secret key for JWT token
const JWT_SECRET = 'your_jwt_secret';

// In-memory "database" (for testing purposes)
const users = [];

// Set up bodyParser for form data and cookieParser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));  // Serve static files from /public

// Configure Multer for file storage
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Middleware to protect routes (e.g., dashboard)
const authenticateToken = (req, res, next) => {
    const token = req.cookies.auth_token;
    if (!token) return res.redirect('/login.html');
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Root route (for testing)
app.get('/', (req, res) => {
    res.send('Welcome to Health Guardian!');
});

// Signup route
app.post('/signup', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = { username: req.body.username, password: hashedPassword };
        users.push(user);
        res.redirect('/login.html');
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).send('Error during signup');
    }
});

// Login route
app.post('/login', async (req, res) => {
    try {
        const user = users.find(u => u.username === req.body.username);
        if (user && await bcrypt.compare(req.body.password, user.password)) {
            const token = jwt.sign({ username: user.username }, JWT_SECRET);
            res.cookie('auth_token', token, { httpOnly: true }).redirect('/dashboard');
        } else {
            // Redirect back to the login page with an error message
            res.redirect('/login.html?error=invalid');
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Error during login');
    }
});

// Serve dashboard page after login
app.get('/dashboard', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Handle file upload and redirect to the upload page with a file list
app.post('/upload', upload.single('prescription'), (req, res) => {
    console.log(req.file);  // Output uploaded file information

    // Get the list of uploaded files
    const uploadDir = './uploads/';
    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            console.error('Error reading upload directory:', err);
            res.status(500).send('Error retrieving files');
            return;
        }

        // Send the file list to the client (you'll need to use a template engine to render the HTML dynamically)
        res.render('upload', { files: files });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
