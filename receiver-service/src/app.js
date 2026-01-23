const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const routes = require('./routes/routes');
const path = require('path');
const app = express();
const authRoutes = require('./routes/auth');

// const authMock = (req, res, next) => {
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//         return res.status(401).json({ 
//             error: "UNAUTHORIZED", 
//             message: "Mock Bearer token required (e.g., Bearer user_123)" 
//         });
//     }
//     // // Extract token and set as sub (Subject/User ID)
//     req.user = { sub: authHeader.split(' ')[1] };
//     next();
// };
/// Changes

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "UNAUTHORIZED" });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // This contains the { sub: 'cust_...' }
        next();
    } catch (err) {
        return res.status(401).json({ error: "INVALID_TOKEN" });
    }
};

// Apply to your routes
const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));

app.use(express.json());

// Apply Mock Auth to all /v1 routes
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/api', authRoutes); // Public login/register
app.use('/', authMiddleware, routes); // Protected receiver routes


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Receiver Service running on port ${PORT}`));