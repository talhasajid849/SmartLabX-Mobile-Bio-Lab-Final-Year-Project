# Mobile Bio Lab Web Application

A comprehensive digital platform designed to transform access to biological laboratory services for education and research. This web application connects users with mobile laboratory services, supporting the entire research process from scheduling to data analysis and reporting.

## 🔬 Overview

The Mobile Bio Lab addresses the critical need for accessible, mobile laboratory solutions in remote and underserved areas. By leveraging modern web technologies, QR/BLE integration, and data visualization tools, this platform enables researchers, students, and technicians to conduct biological research regardless of their physical location.

## ✨ Key Features

- 🔐 User authentication with role-based access control (Student/Researcher/Technician/Admin)
- 📅 Calendar-based lab reservation system
- 🧪 Biological sample data management with metadata capture
- 📱 QR code scanning for automated data input
- 🔵 BLE sensor integration for real-time data collection (pH, temperature)
- 📊 Interactive data visualization (line, bar, pie charts)
- 📄 Automated PDF report generation with charts
- 📧 Data sharing via email and secure links
- 📚 Searchable protocol library for experiments
- 🔔 Real-time notifications and updates

## 🛠 Technologies

**Frontend:** Next.js 16, React 18, Redux Toolkit, Chart.js, React ChartJS 2, Recharts, HTML5 QR Code Scanner, jsPDF, React Toastify, React Calendar, React DatePicker

**Backend:** Node.js, Express.js 5, Prisma ORM, JWT Authentication, Bcrypt, Nodemailer, Multer, Cloudinary, Winston Logger, Node-Cron, Redis (ioredis)

**Database:** PostgreSQL with Prisma ORM

**Security:** Helmet, CORS, XSS-Clean, HPP, Express Rate Limit, Cookie Parser

## 📦 Installation

### Prerequisites
- Node.js (v16+)
- PostgreSQL (v12+)
- npm or yarn
- Redis (optional, for caching)

### Setup
```bash
# Clone repository
git clone https://github.com/yourusername/mobile-biolab.git
cd mobile-biolab

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Environment Configuration

Create `.env` file in **backend** directory:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/mobilebiolab"

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# Server
PORT=5000
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

Create `.env.local` file in **frontend** directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=Mobile Bio Lab
```

### Database Setup
```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database (optional)
npx prisma db seed
```

### Running the Application
```bash
# Start backend (from backend directory)
npm run dev
# Backend runs on http://localhost:5000

# Start frontend (from frontend directory, new terminal)
npm run dev
# Frontend runs on http://localhost:3000
```

## 🚀 Usage

**For Users:**
1. Register and login with your credentials
2. Book lab sessions via the reservation calendar
3. Enter sample data manually or scan QR codes
4. Connect BLE sensors for real-time measurements
5. Visualize data with interactive charts (Chart.js/Recharts)
6. Generate and export PDF reports with jsPDF
7. Access experiment protocols from the library

**For Admins:**
1. Manage user accounts and permissions
2. Upload and organize protocols
3. Monitor system activity and analytics
4. Moderate content and ensure data quality

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/register     - Register new user
POST   /api/auth/login        - User login
POST   /api/auth/logout       - User logout
POST   /api/auth/forgot       - Forgot password
POST   /api/auth/reset/:token - Reset password
GET    /api/auth/me           - Get current user
```

### Users & Profile
```
GET    /api/user/profile      - Get current user profile
PUT    /api/user/profile      - Update user profile
PUT    /api/user/password     - Change password
DELETE /api/user/account      - Delete account
```

### Samples
```
GET    /api/samples           - Get all samples
POST   /api/samples           - Create new sample
GET    /api/samples/:id       - Get specific sample
PUT    /api/samples/:id       - Update sample
DELETE /api/samples/:id       - Delete sample
POST   /api/samples/qr        - Create sample via QR code
```

### Sensors
```
GET    /api/sensors           - Get all sensor readings
POST   /api/sensors           - Log sensor data
GET    /api/sensors/:id       - Get specific sensor reading
DELETE /api/sensors/:id       - Delete sensor reading
```

### Reservations
```
GET    /api/reservations           - Get user reservations
POST   /api/reservations           - Create reservation
GET    /api/reservations/:id       - Get reservation details
PUT    /api/reservations/:id       - Update reservation
DELETE /api/reservations/:id       - Cancel reservation
```

### Reports
```
GET    /api/reports              - Get user reports
POST   /api/reports/generate     - Generate new report
GET    /api/reports/:id          - Get report details
GET    /api/reports/:id/download - Download report PDF
DELETE /api/reports/:id          - Delete report
```

### Protocols
```
GET    /api/protocols         - Get all protocols
POST   /api/protocols         - Upload protocol (admin)
GET    /api/protocols/:id     - Get protocol details
PUT    /api/protocols/:id     - Update protocol (admin)
DELETE /api/protocols/:id     - Delete protocol (admin)
```

### Notifications
```
GET    /api/notifications     - Get user notifications
PUT    /api/notifications/:id/read - Mark notification as read
DELETE /api/notifications/:id - Delete notification
POST   /api/notifications/clear - Clear all notifications
```

### Admin
```
GET    /api/admin/users       - Get all users
PUT    /api/admin/users/:id   - Update user role/status
DELETE /api/admin/users/:id   - Delete user
GET    /api/admin/stats       - Get system statistics
GET    /api/admin/logs        - Get system logs
```

## 🧪 Testing
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Run with coverage
npm run test:coverage
```

## 🏗 Build for Production
```bash
# Build frontend
cd frontend
npm run build
npm start

# Start backend in production
cd backend
NODE_ENV=production npm start
```

## 🔒 Security Features

- JWT-based authentication with HTTP-only cookies
- Password hashing with bcrypt
- Rate limiting to prevent abuse
- Helmet.js for security headers
- XSS protection
- HPP (HTTP Parameter Pollution) prevention
- CORS configuration
- Input validation and sanitization

## 📊 Logging & Monitoring

- Winston logger with daily rotate files
- Request/response logging
- Error tracking and reporting
- System activity audit trails
- Automated cleanup jobs for notifications and logs (node-cron)
- File upload management with static serving

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Contact

**Author:** Talha Sajid (BC220206849)  
**Institution:** Virtual University of Pakistan  
**Department:** Computer Sciences  
**Supervisor:** Muhammad Kamran Qureshi  
**Project Link:** [https://github.com/yourusername/mobile-biolab](https://github.com/yourusername/mobile-biolab)

## 🙏 Acknowledgments

- Virtual University of Pakistan for the learning environment
- Muhammad Kamran Qureshi for project supervision and guidance
- ABC Laboratories for mobile lab service collaboration

---

*Developed as part of BS in Information Technology program at Virtual University of Pakistan (2025)*