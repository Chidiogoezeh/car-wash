# Car Wash Management System

A Node.js and Express-based application for managing car wash operations, customer bookings, staff assignments, payments, and service progress. The system supports role-based access for administrators, attendants, and customers, alongside security middleware, audit logging, and scheduled account cleanup.

## Key Features

- **Role-Based Access Control:** Separate permissions for administrators, attendants, and customers.
- **Authentication:** JWT-based authentication using HTTP-only cookies.
- **Customer Management:** Account registration, login, logout, and scheduled account deletion.
- **Service Management:** Create and manage car wash services and pricing.
- **Booking Management:** Create bookings, track order status, and manage payment confirmations.
- **Attendant Management:** Create staff accounts, assign tasks, and update wash progress.
- **Audit Logging:** Record system activities, IP addresses, and device information.
- **Security Controls:** Rate limiting, Nigeria-only geolocation restrictions in production, and NoSQL injection protection.
- **Automated Maintenance:** Scheduled cleanup of accounts eligible for deletion and inactive customer accounts.
- **Customer Notifications:** Email notifications using Nodemailer.

## Tech Stack

| Category        | Technologies                                  |
| --------------- | --------------------------------------------- |
| Runtime         | Node.js                                       |
| Backend         | Express.js                                    |
| Database        | MongoDB, Mongoose                             |
| Authentication  | JSON Web Tokens (JWT), bcryptjs               |
| Security        | Helmet, express-mongo-sanitize, rate limiting |
| Scheduled Tasks | node-cron                                     |
| Email           | Nodemailer                                    |
| Frontend        | HTML, CSS, JavaScript                         |

## Project Structure

```text
car-wash-management-system/
├── src/
│   ├── config/        # Database configuration
│   ├── controllers/   # Authentication, admin, orders, and tasks
│   ├── middleware/   # Authentication, geoblocking, logging, rate limiting
│   ├── models/       # User, order, service, and audit log schemas
│   ├── routes/       # API route definitions
│   └── utils/        # Email utilities and scheduled jobs
├── public/           # Frontend assets
├── .env              # Local environment configuration
├── .gitignore
├── package.json
└── server.js         # Application entry point
```

## API Documentation

The following endpoints describe the application's API.

### 1. Authentication — `/api/auth`

| Method | Endpoint             | Access        | Description                              |
| ------ | -------------------- | ------------- | ---------------------------------------- |
| POST   | `/register`          | Public        | Register a customer account              |
| POST   | `/login`             | Public        | Authenticate and set an HTTP-only cookie |
| GET    | `/me`                | Authenticated | Retrieve the current user's details      |
| POST   | `/logout`            | Authenticated | Clear the authentication cookie          |
| POST   | `/schedule-deletion` | Authenticated | Schedule account deletion after 30 days  |

### 2. Administration — `/api/admin`

| Method | Endpoint               | Access | Description                             |
| ------ | ---------------------- | ------ | --------------------------------------- |
| POST   | `/attendant`           | Admin  | Create an attendant account             |
| GET    | `/attendants`          | Admin  | Retrieve active attendants              |
| POST   | `/services`            | Admin  | Create a car wash service               |
| GET    | `/orders`              | Admin  | Retrieve all bookings                   |
| PATCH  | `/confirm-payment/:id` | Admin  | Confirm payment for an order            |
| GET    | `/logs`                | Admin  | Retrieve audit logs for a specific date |

### 3. Customer Orders — `/api/orders`

| Method | Endpoint     | Access   | Description                               |
| ------ | ------------ | -------- | ----------------------------------------- |
| POST   | `/`          | Customer | Book a car wash service                   |
| GET    | `/my-orders` | Customer | Retrieve booking history and order status |
| PATCH  | `/paid/:id`  | Customer | Notify the administrator of a payment     |

### 4. Attendant Tasks — `/api/tasks`

| Method | Endpoint      | Access    | Description                     |
| ------ | ------------- | --------- | ------------------------------- |
| GET    | `/my-tasks`   | Attendant | Retrieve assigned tasks         |
| PATCH  | `/status/:id` | Attendant | Update wash progress            |
| PATCH  | `/assign`     | Admin     | Assign an attendant to an order |

**Note:** Endpoint access assumes the corresponding authentication and authorization middleware is configured. The exact request bodies, response formats, and error codes should be documented separately if you want a complete API reference.

## Automated Maintenance

A scheduled job runs daily at midnight to perform account maintenance:

- **Scheduled Deletion:** Permanently removes accounts whose 30-day deletion period has elapsed.
- **Inactivity Cleanup:** Removes customer accounts inactive for more than 90 days.

Ensure these cleanup rules match your retention policy and that any required notifications or recovery periods are handled before permanent deletion.

## Security

- **HTTP-Only Authentication Cookies:** Helps prevent client-side JavaScript from reading authentication cookies.
- **Rate Limiting:** Limits authentication attempts to 10 requests per 15 minutes, as configured.
- **Geolocation Restrictions:** Restricts access to requests identified as originating outside Nigeria in production.
- **Input Sanitization:** Uses `express-mongo-sanitize` to help prevent NoSQL injection.
- **Security Headers:** Uses Helmet to configure HTTP security headers.
- **Audit Logging:** Records relevant actions and request metadata for monitoring and troubleshooting.

Security depends on correct configuration and deployment. Geolocation restrictions, in particular, require a trusted IP-geolocation mechanism and appropriate handling of proxies.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- MongoDB instance, local or hosted
- Gmail account or another supported SMTP provider if email notifications are enabled

### 1. Clone the Repository

```bash
git https://github.com/Chidiogoezeh/car-wash.git
cd car-wash
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_strong_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_app_password
NODE_ENV=development
```

Use a strong, private JWT secret and valid database credentials. If using Gmail, configure an app password where required.

**Important:** Never commit your `.env` file or expose credentials in your repository. Add `.env` to `.gitignore` and consider providing a `.env.example` containing placeholder values.

### 4. Start the Application

```bash
node server.js
```

The application should start on the configured port, defaulting to `5000`.

For local development, you can use `NODE_ENV=development`. Production deployments should use secure environment variables and an appropriate process manager or hosting platform.

## Future Improvements

Potential areas for further development include:

- Automated API tests and integration tests.
- API documentation with Swagger/OpenAPI.
- Centralized error handling and structured application logging.
- Booking and payment workflow improvements.
- Deployment automation and health monitoring.

## Contributing

Contributions, bug reports, and suggestions are welcome. For significant changes, open an issue first to discuss the proposed improvement.

## License

MIT.
