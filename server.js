// Importing necessary modules
require('rootpath')();
require('dotenv').config();
const express = require('express');
const path = require('path');
const { Role } = require('./_models');
const { testConnection, syncDatabase } = require('./_config/database');
const cronService = require('./_services/cronService');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const routes = require("./routes");
const errorHandler = require('_middleware/error-handler');

/**
 * This script starts the server and sets up the necessary middleware and routes.
 * It first establishes a connection to the MariaDB database using Sequelize.
 * Then, it initializes the roles in the database if they don't exist.
 * After that, it creates an Express application and sets up the middleware for parsing request bodies, parsing cookies, enabling CORS, and handling errors.
 * It also sets up the routes for the application by calling the function exported by the routes module.
 * Finally, it starts the server on the specified port and logs a message.
 */

// start server
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 3000) : process.env.DEV_PORT;

async function startServer() {
    try {
        // Test database connection
        const isConnected = await testConnection();
        if (!isConnected) {
            console.error("Failed to connect to MariaDB");
            process.exit(1);
        }

        // Sync database (create tables if they don't exist)
        await syncDatabase();

        // Initialize roles
        await init();

        const app = express();
        app.use(bodyParser.urlencoded({ extended: false }));
        app.use(bodyParser.json());
        app.use(cookieParser());

        // allow cors requests from any origin and with credentials
        app.use(cors({ origin: (origin, callback) => callback(null, true), credentials: true }));

        // global error handler
        app.use(errorHandler);
        routes(app);
        
        // Start Cron Service
        cronService.start();
        
        app.listen(port, () => {
            console.log('Server listening on port ' + port);
            console.log('Cron-Service aktiviert');
        });
    } catch (err) {
        console.error("Server startup error:", err);
        process.exit(1);
    }
}

/**
 * This function initializes the roles in the database if they don't exist.
 * It first checks the count of roles in the 'roles' table.
 * If the count is 0, it creates new entries for the 'user', 'vrsw', and 'admin' roles.
 */
async function init() {
    try {
        const roleCount = await Role.count();
        
        if (roleCount === 0) {
            const roles = [
                { name: "user" },
                { name: "vrsw" },
                { name: "admin" }
            ];

            await Role.bulkCreate(roles);
            console.log("Added roles to database");
        } else {
            console.log("Roles already exist in database");
        }
    } catch (error) {
        console.error("Error initializing roles:", error);
    }
}

// Graceful Shutdown Handler
process.on('SIGINT', () => {
    console.log('\n🛑 SIGINT empfangen, beende Server...');
    cronService.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 SIGTERM empfangen, beende Server...');
    cronService.stop();
    process.exit(0);
});

// Start the server
startServer();