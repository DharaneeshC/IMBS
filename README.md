# IBMS - Inventory Billing Management System

A full-stack jewelry inventory and billing management system built with React and Node.js.

## Authentication System

**NEW:** Complete authentication system with secure login and session management!

**IMPORTANT:** Change this password after first login!

For setup instructions, see: [AUTHENTICATION_SETUP.md](AUTHENTICATION_SETUP.md)  
For quick testing, see: [QUICK_START.md](QUICK_START.md)

## Features

- **Secure Authentication** - JWT-based login with password hashing (NEW)
- **User Management** - Admin-controlled user accounts with roles (NEW)
- **Protected Routes** - All pages require authentication (NEW)
- **Product Management** - Track jewelry inventory with images, categories, and stock levels
- **Designer Management** - Manage designer information and their products
- **Real-time Notifications** - Live stock alerts and inventory monitoring via WebSocket
- **Dashboard** - Comprehensive overview of sales, inventory, and activities

## Tech Stack

### Frontend
- React.js
- Tailwind CSS
- Socket.IO Client
- Axios
- React Router v6 (with protected routes)

### Backend
- Node.js
- Express.js
- MySQL (updated from PostgreSQL)
- Socket.IO
- Sequelize ORM
- JWT (jsonwebtoken)
- bcryptjs (password hashing)

## Project Structure

```
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Route controllers (including authController)
│   ├── middleware/      # Authentication middleware
│   ├── models/          # Database models (including User)
│   ├── routes/          # API routes (including authRoutes)
│   ├── migrations/      # Database migrations
│   ├── utils/           # Utility functions
│   ├── setup-admin.js   # Admin user setup script
│   └── server.js        # Main server file
│
└── frontend/
    ├── public/          # Static assets
    └── src/
        ├── api/         # API client (with JWT interceptors)
        ├── components/  # React components (including Login)
        └── contexts/    # React contexts (including AuthContext)
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MySQL database
- npm or yarn

### Quick Start

1. **Clone the repository**

2. **Backend Setup**
```bash
cd backend
npm install
```

3. **Configure Environment**
Create `.env` file in backend folder:
```env
DB_NAME=jewellery_shop
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306
JWT_SECRET=your-secret-key
```

4. **Setup Database & Admin User**
```bash
npm run setup          # Create database tables
npm run setup-admin    # Create default admin user
```

5. **Start Backend**
```bash
npm run dev
```

6. **Frontend Setup**
```bash
cd frontend
npm install
npm start
```

7. **Login**
- Open `http://localhost:3000`
- Use credentials: `admin@jewellery.com` / `admin123`

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL database

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example` and configure your database credentials

4. Run database setup:
```bash
node setup-database.js
```

5. Start the server:
```bash
npm start
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example` and configure the API URL

4. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## Deployment

- **Frontend**: Deployed on Vercel
- **Backend**: Deployed on Railway

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is private and proprietary.
