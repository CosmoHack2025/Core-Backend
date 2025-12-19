# Healthcare Management System - Backend API (Hackethon)

A comprehensive healthcare management system backend built for hackathon, featuring AI-powered medical report analysis, hospital search, doctor management, and intelligent chatbot assistance using Google Gemini AI.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [API Endpoints](#api-endpoints)
- [Usage Examples](#usage-examples)

## Features

### Core Functionality
- **User Management**: Patient, Doctor, and Admin role-based authentication
- **Medical Report Analysis**: AI-powered PDF report analysis using AWS Textract and Google Vertex AI
- **Hospital Search**: Google Maps API integration for finding nearby hospitals, clinics, and pharmacies
- **Appointment Booking**: Schedule and manage doctor appointments
- **AI Chatbot**: Healthcare assistant powered by Google Gemini AI
- **Recommendations**: AI-generated health recommendations based on medical reports
- **Analytics**: Track patient health metrics with severity scoring
- **Contact System**: Email notifications for contact form submissions

### Advanced Features
- PDF text extraction using AWS Textract
- Image analysis using AWS Rekognition
- File storage with AWS S3 and Supabase
- Email notifications via Nodemailer
- JWT-based authentication
- Role-based access control
- Automated severity calculation

## Technology Stack

**Backend Framework**
- Node.js v18+
- Express.js v5.1.0

**Database**
- PostgreSQL
- Sequelize ORM v6.37.7

**AI & Machine Learning**
- Self Built Model
- Google Vertex AI (Gemini 2.0-flash-exp, 1.5-flash, 1.5-pro)
- Google Maps API

**Cloud Services**
- AWS S3 (File Storage)
- AWS Textract (PDF Text Extraction)
- Supabase (Alternative Storage)

**Authentication & Security**
- JWT (jsonwebtoken v9.0.2)
- bcryptjs v2.4.3
- Cookie-based authentication

**Additional Libraries**
- Axios v1.13.1 (HTTP Client)
- Multer v2.0.2 (File Upload)
- Nodemailer v7.0.10 (Email)
- UUID v11.0.3 (Unique Identifiers)

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT APPLICATION                           │
│                    (Frontend - React/Next.js)                        │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ HTTP/HTTPS
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                      EXPRESS.JS SERVER                               │
│                     (Node.js Backend API)                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Middleware  │  │  Controllers │  │    Routes    │             │
│  │  - Auth      │  │  - Patient   │  │  - Patient   │             │
│  │  - CORS      │  │  - Doctor    │  │  - Doctor    │             │
│  │  - Cookies   │  │  - Admin     │  │  - Admin     │             │
│  └──────────────┘  │  - Report    │  │  - Report    │             │
│                    │  - Hospital  │  │  - Hospital  │             │
│                    │  - Chat      │  │  - Chat      │             │
│                    └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
           │                  │                  │
           │                  │                  │
┌──────────▼──────┐  ┌───────▼───────┐  ┌──────▼──────────┐
│   PostgreSQL    │  │  Cloud Services│  │  AI Services    │
│   Database      │  │  - AWS S3      │  │  - Vertex AI    │
│  - Sequelize    │  │  - AWS Textract│  │  - Gemini AI    │
│  - Users        │  │  - AWS Rekogn. │  │  - Google Maps  │
│  - Reports      │  │  - Supabase    │  │                 │
│  - Bookings     │  │                │  │                 │
└─────────────────┘  └────────────────┘  └─────────────────┘
```

## Project Structure

```
hacksprint-ps5-backend/
│
├── config/
│   ├── awsConfig/
│   │   └── awsConfig.js                    # AWS S3, Textract, Rekognition config
│   ├── googleMapsConfig/
│   │   └── googleMapsConfig.js             # Google Maps API configuration
│   ├── nodemailerConfig/
│   │   └── nodemailerConfig.js             # Email service configuration
│   ├── postgresConfig/
│   │   └── postgres.js                     # PostgreSQL connection config
│   └── uploadConfig/
│       └── supabaseUpload.js               # Supabase storage configuration
│
├── controller/
│   ├── adminController/
│   │   └── adminController.js              # Admin operations (user management)
│   ├── chatController/
│   │   └── chatController.js               # Gemini AI chatbot logic
│   ├── doctorController/
│   │   └── doctorController.js             # Doctor-specific operations
│   ├── hospitalController/
│   │   └── hospitalController.js           # Hospital search functionality
│   ├── patientController/
│   │   └── patientController.js            # Patient operations
│   ├── recommendationController/
│   │   └── gemniController.js              # AI recommendations generation
│   ├── reportController/
│   │   └── reportController.js             # Medical report processing
│   └── userController/
│       └── userController.js               # User authentication
│
├── model/
│   ├── analyticsModel/
│   │   └── analytics.js                    # Health analytics tracking
│   ├── assesmentModel/
│   │   └── assesment.js                    # Health assessment data
│   ├── associationModel/
│   │   └── association.js                  # Database relationships
│   ├── bookingModel/
│   │   └── booking.js                      # Appointment bookings
│   ├── chatModel/
│   │   ├── chatMessage.js                  # Chat message storage
│   │   └── chatSession.js                  # Chat session tracking
│   ├── doctorModel/
│   │   └── doctor.js                       # Doctor profile & credentials
│   ├── patientModel/
│   │   └── patient.js                      # Patient profile & medical history
│   ├── recommendationModel/
│   │   └── recommendation.js               # AI-generated recommendations
│   ├── reportModel/
│   │   └── report.js                       # Medical report metadata
│   ├── userModel/
│   │   └── user.js                         # Base user authentication
│   └── index.js                            # Model exports
│
├── route/
│   ├── adminRoute/
│   │   └── adminRoute.js                   # Admin API endpoints
│   ├── bookingRoute/
│   │   └── bookingRoute.js                 # Booking API endpoints
│   ├── chatRoute/
│   │   └── chatRoute.js                    # Chat API endpoints
│   ├── contactRoute/
│   │   └── contactRoute.js                 # Contact form endpoints
│   ├── doctorRoute/
│   │   └── doctorRoute.js                  # Doctor API endpoints
│   ├── hospitalRoute/
│   │   └── hospitalRoute.js                # Hospital search endpoints
│   ├── patientRoute/
│   │   └── patientRoute.js                 # Patient API endpoints
│   ├── recommendationRoute/
│   │   └── gemniRoute.js                   # Recommendation endpoints
│   └── reportRoute/
│       └── reportRoute.js                  # Report analysis endpoints
│
├── middleware/
│   ├── authMiddleware.js                   # JWT authentication
│   ├── optionalMiddleware.js               # Optional authentication
│   └── roleMiddleware.js                   # Role-based access control
│
├── cloudServices/
│   ├── hospitalSearch.js                   # Google Maps hospital search
│   └── upload.js                           # AWS S3 file upload
│
├── aiServices/
│   └── (AI-related utilities)
│
├── authServices/
│   ├── authService.js                      # Authentication logic
│   ├── clearTokenCookie.js                 # Cookie clearing utility
│   └── setTokenCookie.js                   # Cookie setting utility
│
├── emailService/
│   └── emailService.js                     # Email sending service
│
├── rekognitionServices/
│   └── rekognition.js                      # AWS Rekognition integration
│
├── dbConnection/
│   ├── dbConfig.js                         # Database connection
│   ├── dbSync.js                           # Database synchronization
│   ├── migrate-chat.js                     # Chat tables migration
│   └── migrate-patient-location.js         # Patient location migration
│
├── .env                                    # Environment variables
├── .gitignore                              # Git ignore rules
├── package.json                            # Project dependencies
├── server.js                               # Application entry point
├── service-account-key.json                # Google Cloud credentials
├── CHAT_API_DOCS.md                        # Chat API documentation
└── HOSPITAL_API_DOCS.md                    # Hospital API documentation
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v12.0 or higher
- **npm**: v8.0.0 or higher

### Required Cloud Accounts & API Keys

1. **AWS Account**
   - S3 Bucket access
   - Textract API access
   - Rekognition API access

2. **Google Cloud Platform**
   - Vertex AI API enabled
   - Maps API enabled
   - Service Account with appropriate permissions

3. **Supabase Account**
   - Storage bucket configured

4. **Email Service**
   - Gmail account with App Password

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/HackSprint2025/hacksprint-ps5-backend.git
cd hacksprint-ps5-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration (see Environment Variables section below).

### 4. Setup Google Cloud Service Account

1. Download your Google Cloud service account key JSON file
2. Rename it to `service-account-key.json`
3. Place it in the root directory of the project

### 5. Database Setup

Run the following commands to set up the database:

```bash
# Run chat tables migration
node dbConnection/migrate-chat.js

# Run patient location migration
node dbConnection/migrate-patient-location.js
```

The application will automatically sync other models on startup.

### 6. Start the Server

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

The server will start on `http://localhost:9191` (or your configured PORT).

## Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=9191
JWT_SECRET=your_jwt_secret_key_here

# Frontend URL
FRONTEND_URL=http://localhost:5173

# PostgreSQL Database
POSTGRES_DB_HOST=your_postgres_host
POSTGRES_DB_PORT=6543
POSTGRES_DB_NAME=postgres
POSTGRES_DB_USER=your_db_user
POSTGRES_DB_PASS=your_db_password

# AWS Configuration
AWS_ACCESS_KEY=your_aws_access_key
AWS_SECRET_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_REGION_S3=us-east-1
AWS_REGION_REKOGNITION=us-east-1
AWS_BUCKET_NAME=your_bucket_name

# Supabase Configuration
PROJECT_URL=https://your-project.supabase.co
PROJECT_SERVICE_ROLE_KEY=your_supabase_key
PROJECT_BUCKET=your_bucket_name
PROJECT_STORAGE_URL=https://your-storage-url.supabase.co/storage/v1/object/public/bucket_name/

# Email Configuration (Gmail)
PROJECT_EMAIL=your_email@gmail.com
PROJECT_PASSWORD=your_app_password

# Google Cloud Configuration
VERTEX_PROJECT_ID=your_project_id
VERTEX_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Database Setup

The application uses PostgreSQL with Sequelize ORM. Database tables are created automatically on startup, but some migrations need to be run manually.

### Manual Migrations

```bash
# Create chat_sessions and chat_messages tables
node dbConnection/migrate-chat.js

# Add latitude and longitude to patients table
node dbConnection/migrate-patient-location.js
```

### Database Schema

**Core Tables:**
- `users` - Base user authentication
- `patients` - Patient profiles and medical history
- `doctors` - Doctor profiles and credentials
- `admins` - Admin user records
- `reports` - Medical report metadata
- `analytics` - Health analytics data
- `recommendations` - AI-generated recommendations
- `bookings` - Appointment bookings
- `chat_sessions` - Chat session tracking
- `chat_messages` - Chat message history

## API Documentation

### Base URL
```
http://localhost:9191/api
```

### Authentication

Most endpoints require JWT authentication. Include the token in cookies or Authorization header:

```
Cookie: token=your_jwt_token
```

or

```
Authorization: Bearer your_jwt_token
```

## API Endpoints

### User Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/patient/register` | Register new patient | Public |
| POST | `/api/patient/login` | Patient login | Public |
| POST | `/api/doctor/register` | Register new doctor | Public |
| POST | `/api/doctor/login` | Doctor login | Public |
| POST | `/api/admin/login` | Admin login | Public |
| POST | `/api/patient/logout` | Logout user | Private |

### Patient Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/patient/profile` | Get patient profile | Patient |
| PUT | `/api/patient/profile` | Update patient profile | Patient |
| GET | `/api/patient/reports` | Get patient's reports | Patient |
| GET | `/api/patient/bookings` | Get patient's bookings | Patient |

### Doctor Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/doctor/profile` | Get doctor profile | Doctor |
| PUT | `/api/doctor/profile` | Update doctor profile | Doctor |
| GET | `/api/doctor/patients` | Get doctor's patients | Doctor |
| GET | `/api/doctor/bookings` | Get doctor's appointments | Doctor |

### Admin Operations

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/admin/doctors` | Get all doctors | Admin |
| GET | `/api/admin/doctors?query=term` | Search doctors | Admin |
| PUT | `/api/admin/doctor/:id/approve` | Approve doctor | Admin |
| GET | `/api/admin/patients` | Get all patients | Admin |
| DELETE | `/api/admin/user/:id` | Delete user | Admin |

### Medical Reports

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/report/upload` | Upload & analyze report | Patient |
| GET | `/api/report/:id` | Get report details | Patient/Doctor |
| DELETE | `/api/report/:id` | Delete report | Patient |
| GET | `/api/report/:id/analytics` | Get report analytics | Patient/Doctor |

### AI Recommendations

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/recommendation/generate` | Generate recommendations | Patient |
| GET | `/api/recommendation/:analyticsId` | Get recommendations | Patient |

### Hospital Search

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/hospital/nearby` | Find nearby hospitals | Public |

**Request Body:**
```json
{
  "latitude": 28.7041,
  "longitude": 77.1025,
  "radius": 15000
}
```

**Response:**
- Returns top 10 hospitals, clinics, and pharmacies
- Sorted by priority (Hospital > Clinic > Pharmacy) and distance
- Includes photos, contact, hours, ratings

### AI Chatbot

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/chat/start` | Start chat session | Public |
| POST | `/api/chat` | Send message to AI | Public |

**Start Chat Request:**
```json
{}
```



### Appointments

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/booking/create` | Create appointment | Patient |
| GET | `/api/booking/:id` | Get booking details | Patient/Doctor |
| PUT | `/api/booking/:id/status` | Update booking status | Doctor |
| DELETE | `/api/booking/:id` | Cancel booking | Patient |

### Contact Form

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/contact` | Submit contact form | Public |

## Usage Examples

#

### 2. Upload Medical Report

```bash
curl -X POST http://localhost:9191/api/report/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/report.pdf" \
  -F "reportType=Blood Test"
```

### 3. Search Nearby Hospitals

```bash
curl -X POST http://localhost:9191/api/hospital/nearby \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 28.7041,
    "longitude": 77.1025,
    "radius": 15000
  }'
```

### 4. Chat with AI


## Data Flow

### Medical Report Analysis Flow

```
Patient Upload PDF
       │
       ▼
AWS S3 Storage
       │
       ▼
AWS Textract (Extract Text)
       │
       ▼
   Our AI Model (Early Predict disease)
       │
       ▼
Google Vertex AI (Analyze Medical Data)
       │
       ▼
PostgreSQL (Store Results)
       │
       ▼
Calculate Severity & Analytics
       │
       ▼
Generate AI Recommendations
       │
       ▼
Return to Patient
```

### Hospital Search Flow

```
User Location (Lat/Lng)
       │
       ▼
Google Maps Places API
       │
       ├─► Search Hospitals
       ├─► Search Clinics
       └─► Search Pharmacies
       │
       ▼
Fetch Details for Each
       │
       ▼
Calculate Distances
       │
       ▼
Sort by Priority & Distance
       │
       ▼
Return Top 10 Results
```

### Chat Flow

```
User Message
       │
       ▼
Generate Session ID
       │
       ▼
Build Conversation History
       │
       ▼
Google Gemini AI
       │
       ├─► Try gemini-2.0-flash-exp
       ├─► Fallback to gemini-1.5-flash
       └─► Fallback to gemini-1.5-pro
       │
       ▼
Return AI Response
       │
       ▼
Update Conversation History
```

## Error Handling

The API returns standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error



## Security Features

- Password hashing with bcryptjs
- JWT token authentication
- HTTP-only cookies
- CORS configuration
- Role-based access control
- Input validation
- SHA-256 Encryption
- SQL injection prevention (Sequelize ORM)

## Performance Considerations

- Database indexing on frequently queried fields
- Efficient file uploads with streaming
- AI model fallback strategy
- Connection pooling for database
- Request timeout handling



### Google Cloud Issues
- Verify `service-account-key.json` is in root directory

## License

This project was created for a hackathon. All rights reserved.

## Acknowledgments

Built for HackSprint 2025 Hackathon

**Technologies Used:**
- Express.js
- PostgreSQL & Sequelize
- Google Cloud (Gemini AI, Maps API)
- AWS (S3, Textract)
- Supabase

---

**Note:** This is a hackathon project. It is not intended for production use without proper security audits and enhancements.
