Car Wash Application
A robust, production-ready backend system designed for managing car wash operations. This system features multi-role access (Admin, Attendant, Customer), real-time status updates, audit logging, and automated maintenance tasks.

Key Updates
Removed Device ID Constraint: Registration is now simplified to encourage higher user conversion; unique hardware fingerprinting is no longer required.

Rebranded: Unified naming convention under "Car Wash Management System."

Enhanced Security: Implemented Geo-blocking (Nigeria-only access), JWT-based cookie authentication, and rate-limiting.

Audit Logging: Comprehensive system logging tracking actions, IP addresses, and device types.

Tech Stack
Backend: Node.js, Express.js

Database: MongoDB with Mongoose ODM

Security: JWT, BcryptJS, Helmet, Express-Mongo-Sanitize

Utilities: Node-Cron (for daily cleanup), Nodemailer (for customer notifications)

Project Structure
/
├── src/
│   ├── config/      # Database connection
│   ├── controllers/ # Business logic (Auth, Admin, Orders, Tasks)
│   ├── middleware/  # Auth, GeoBlock, Logger, Rate-Limiter
│   ├── models/      # Mongoose Schemas (User, Order, Service, AuditLog)
│   ├── routes/      # API Route definitions
│   └── utils/       # Mailer, Cron Jobs
├── public/          # Frontend assets (HTML, CSS, JS)
└── server.js        # Entry point

API Documentation
1. Authentication (/api/auth)
Method,Endpoint,Access,Description
POST,/register,Public,Register a new customer account.
POST,/login,Public,Authenticate user and receive HTTP-only cookie.
GET,/me,Private,Get current logged-in user details.
POST,/logout,Private,Clear authentication cookie.
POST,/schedule-deletion,Private,Schedule account for deletion in 30 days.

2. Admin Operations (/api/admin)
Method,Endpoint,Access,Description
POST,/attendant,Admin,Create a new staff/attendant account.
GET,/attendants,Admin,Fetch all active staff members.
POST,/services,Admin,Add a new car wash service (Price/Name).
GET,/orders,Admin,View every booking in the system.
PATCH,/confirm-payment/:id,Admin,Confirm receipt of payment for an order.
GET,/logs,Admin,Fetch system audit logs for a specific date.

3. Customer Orders (/api/orders)
Method,Endpoint,Access,Description
POST,/,Customer,Book a new car wash service.
GET,/my-orders,Customer,View booking history and current status.
PATCH,/paid/:id,Customer,Notify admin that payment has been made.

4. Attendant Tasks (/api/tasks)
Method,Endpoint,Access,Description
GET,/my-tasks,Attendant,View tasks assigned by the Admin.
PATCH,/status/:id,Attendant,"Update wash progress (Started, Completed)."
PATCH,/assign,Admin,Assign a specific attendant to a pending order.

Automated Tasks (Cron Jobs)
The system runs a daily cleanup job at 00:00 (Midnight):

Permanent Deletion: Deletes accounts that have reached their 30-day scheduled deletion date.

Inactivity Cleanup: Automatically removes customer accounts that have been inactive for over 90 days.

Security Implementation
Geo-Blocking: In production, requests from outside Nigeria (NG) are blocked by default.

Rate Limiting: Auth routes are limited to 10 attempts per 15 minutes to prevent brute-force attacks.

Data Sanitization: Protects against NoSQL injection and XSS via helmet and express-mongo-sanitize.

Getting Started
Clone and Install:
npm install

Environment Variables (.env):
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
EMAIL_USER=your_gmail
EMAIL_PASS=your_app_password
NODE_ENV=development

Run the App:
node server.js