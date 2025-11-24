# MERN-AUTH Backend Server Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Technologies & Dependencies](#technologies--dependencies)
5. [File Directory Explained](#file-directory-explained)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Authentication Flow](#authentication-flow)
9. [Email System](#email-system)
10. [Middleware & Security](#middleware--security)
11. [Configuration](#configuration)
12. [Running the Server](#running-the-server)
13. [Error Handling](#error-handling)
14. [Deployment](#deployment)

---

## Project Overview

The MERN-AUTH backend is a Node.js/Express server that provides secure user authentication with email verification and password reset functionality. It uses MongoDB for data persistence, JWT for token-based authentication, and Brevo (formerly Sendinblue) for email delivery.

**Key Features:**
- User Registration with password hashing
- Email-based authentication
- Email verification with OTP
- Password reset flow with OTP
- JWT token-based session management
- Secure cookie handling
- CORS protection
- MongoDB integration

---

## Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                  MERN-AUTH Backend (Node.js/Express)            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Express.js Application                      │  │
│  │              (server.js - Port 4000)                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│        ┌──────────────────┼──────────────────┐                 │
│        │                  │                  │                  │
│    ┌───▼────────┐  ┌──────▼────┐   ┌────────▼──┐              │
│    │  Routes    │  │Middleware │   │Controller │              │
│    │  (/routes) │  │ (/middleware) │(/controllers)            │
│    └───┬────────┘  └──────┬────┘   └────────┬──┘              │
│        │                  │                  │                  │
│        └──────────────────┼──────────────────┘                 │
│                           │                                     │
│        ┌──────────────────▼──────────────────┐                 │
│        │  MongoDB Models (/models)           │                 │
│        │  - userModel                        │                 │
│        └──────────────────────────────────────┘                │
│                           │                                     │
│        ┌──────────────────▼──────────────────┐                 │
│        │  Config Files (/config)             │                 │
│        │  - mongodb.js                       │                 │
│        │  - nodemailer.js                    │                 │
│        │  - emailTemplates.js                │                 │
│        └──────────────────────────────────────┘                │
│                           │                                     │
│    ┌──────────────────────┼──────────────────────┐             │
│    │                      │                      │              │
│    ▼                      ▼                      ▼              │
│ MongoDB            Brevo SMTP            Frontend Client       │
│ (localhost:27017)  (smtp-relay.brevo.com) (http://localhost:  │
│                                            5173)               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
server/
│
├── server.js                        # Express app setup & server start
│
├── config/
│   ├── mongodb.js                   # MongoDB connection
│   ├── nodemailer.js                # Email configuration & sender
│   └── emailTemplates.js            # Email HTML templates
│
├── controllers/
│   ├── authController.js            # Auth logic (register, login, etc.)
│   └── userController.js            # User data retrieval
│
├── middleware/
│   └── userAuth.js                  # JWT verification middleware
│
├── models/
│   └── userModel.js                 # MongoDB User schema
│
├── routes/
│   ├── authRoutes.js                # Auth endpoint routes
│   └── userRoutes.js                # User endpoint routes
│
├── .env                             # Environment variables
├── package.json                     # Dependencies & scripts
└── README.md                        # Project README

```

---

## Technologies & Dependencies

### Core Dependencies
- **Express** (5.1.0) - Web framework
- **Mongoose** (8.19.0) - MongoDB ODM
- **Node.js** (v16+) - JavaScript runtime
- **dotenv** (17.2.3) - Environment variable management

### Authentication & Security
- **jsonwebtoken** (9.0.2) - JWT token creation & verification
- **bcryptjs** (3.0.2) - Password hashing
- **cookie-parser** (1.4.7) - Cookie parsing middleware
- **cors** (2.8.5) - Cross-Origin Resource Sharing

### Email Service
- **nodemailer** (7.0.6) - Email sending

### Development
- **nodemon** (3.1.10) - Auto-restart on file changes

---

## File Directory Explained

### `/server.js`
Main application entry point that:
- Configures Express middleware (JSON parser, cookie parser, CORS)
- Establishes MongoDB connection
- Sets up route handlers
- Starts server on port 4000

```javascript
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import authRoutes from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";

const app = express();
const port = process.env.PORT || 4000;
connectDB();

const allowedOrigins = ['http://localhost:5173']

app.use(express.json());
app.use(cookieParser());
app.use(cors({origin: allowedOrigins, credentials: true }));

// Routes
app.get('/', (req, res) => res.send("API WORKING FINE"));
app.use("/api/auth", authRoutes);
app.use("/api/user", userRouter);

app.listen(port, () => console.log(`server started on PORT : ${port}`));
```

### `/config/mongodb.js`
Connects to MongoDB database using Mongoose:

```javascript
import mongoose from "mongoose";

const connectDB = async () => {
  mongoose.connection.on("connected", () => console.log("MongoDB connected"));
  await mongoose.connect(`${process.env.MONGODB_URI}`);
};

export default connectDB;
```

### `/config/nodemailer.js`
Configures email transport and provides sendEmail function:

```javascript
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"My App" <${process.env.SENDER_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log("✅ Email sent:", info.messageId);
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    return { success: false, message: error.message };
  }
};

export default transporter;
```

### `/config/emailTemplates.js`
Contains HTML email templates for OTP delivery:

```javascript
export const EMAIL_VERIFY_TEMPLATE = `...HTML template...`
export const PASSWORD_RESET_TEMPLATE = `...HTML template...`
```

### `/models/userModel.js`
Defines MongoDB User schema:

```javascript
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  verifyotp: { type: String, default: "" },
  verifyotpExpireAt: { type: Number, default: 0 },
  isAccountVerified: { type: Boolean, default: false },
  resetotp: { type: String, default: "" },
  resetotpExpireAt: { type: Number, default: 0 },
});

const userModel = mongoose.models.user || mongoose.model("user", userSchema);
export default userModel;
```

### `/middleware/userAuth.js`
Verifies JWT token from cookies and extracts user ID:

```javascript
import jwt from "jsonwebtoken";

const userAuth = async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return res.json({
      success: false,
      message: "Not Unauthorized. Login Again",
    });
  }
  
  try {
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
    if (tokenDecode.id) {
      req.userId = tokenDecode.id;
    } else {
      return res.json({
        success: false,
        message: "Token is not Authorized, login again",
      });
    }
    next();
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export default userAuth;
```

### `/controllers/authController.js`
Handles all authentication logic:

**Key Functions:**
- `register()` - User registration with password hashing
- `login()` - User login with password verification
- `logout()` - Clear auth cookie
- `sendVerifyOtp()` - Generate & send email verification OTP
- `verifyEmail()` - Verify email with OTP
- `sendResetOtp()` - Generate & send password reset OTP
- `resetPassword()` - Reset password with OTP verification
- `isAuthenticated()` - Check if user is authenticated

### `/controllers/userController.js`
Handles user data operations:

**Key Functions:**
- `getUserData()` - Fetch user profile information

### `/routes/authRoutes.js`
Defines authentication endpoints:

```javascript
import express from "express";
import { 
  register, login, logout, sendVerifyOtp, 
  verifyEmail, isAuthenticated, sendResetOtp, 
  resetPassword 
} from "../controllers/authController.js";
import userAuth from "../middleware/userAuth.js";

const authRoutes = express.Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.post("/logout", logout);
authRoutes.post("/send-verify-otp", userAuth, sendVerifyOtp);
authRoutes.get("/is-auth", userAuth, isAuthenticated);
authRoutes.post("/send-reset-otp", sendResetOtp);
authRoutes.post("/reset-password", userAuth, resetPassword);
authRoutes.post("/verify-account", userAuth, verifyEmail);

export default authRoutes;
```

### `/routes/userRoutes.js`
Defines user data endpoints:

```javascript
import express from "express";
import { getUserData } from "../controllers/userController.js";
import userAuth from "../middleware/userAuth.js";

const userRouter = express.Router();

userRouter.get("/data", userAuth, getUserData);

export default userRouter;
```

---

## Database Schema

### User Schema (MongoDB)

```javascript
{
  _id: ObjectId,                  // MongoDB auto-generated ID
  name: String,                   // User's full name (required)
  email: String,                  // User's email (required, unique)
  password: String,               // Bcrypt-hashed password (required)
  verifyotp: String,              // 6-digit OTP for email verification (default: "")
  verifyotpExpireAt: Number,      // Unix timestamp for OTP expiry (default: 0)
  isAccountVerified: Boolean,     // Email verification status (default: false)
  resetotp: String,               // 6-digit OTP for password reset (default: "")
  resetotpExpireAt: Number,       // Unix timestamp for reset OTP expiry (default: 0)
  createdAt: Date,                // Auto-generated creation timestamp
  updatedAt: Date                 // Auto-generated update timestamp
}
```

### Example User Document

```json
{
  "_id": "ObjectId('507f1f77bcf86cd799439011')",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "$2a$10$...",
  "verifyotp": "123456",
  "verifyotpExpireAt": 1700676000000,
  "isAccountVerified": false,
  "resetotp": "",
  "resetotpExpireAt": 0,
  "createdAt": "2024-11-22T10:30:00Z",
  "updatedAt": "2024-11-22T10:35:00Z"
}
```

---

## API Endpoints

### Authentication Endpoints

#### 1. Register User
```
POST /api/auth/register
Content-Type: application/json

Request Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

Response (Success):
{
  "success": true,
  "message": "User Registered Successfully"
}

Response (Error):
{
  "success": false,
  "message": "User Already Exists" | "Missing Details" | error.message
}

Cookies Set:
- token: JWT_TOKEN (httpOnly, secure in production, 7 days expiry)

Backend Operations:
1. Validate input (name, email, password present)
2. Check if user already exists
3. Hash password with bcrypt (10 salt rounds)
4. Create user in MongoDB
5. Generate JWT token
6. Set token in httpOnly cookie
7. Send welcome email via Brevo SMTP
```

#### 2. Login User
```
POST /api/auth/login
Content-Type: application/json

Request Body:
{
  "email": "john@example.com",
  "password": "password123"
}

Response (Success):
{
  "success": true,
  "message": "Login Successful"
}

Response (Error):
{
  "success": false,
  "message": "Invalid email" | "Invalid password" | error.message
}

Cookies Set:
- token: JWT_TOKEN (httpOnly, secure in production, 7 days expiry)

Backend Operations:
1. Validate input (email, password present)
2. Find user by email in MongoDB
3. Compare password with bcrypt
4. Generate JWT token if password matches
5. Set token in httpOnly cookie
```

#### 3. Logout User
```
POST /api/auth/logout
Authorization: JWT_TOKEN (via cookie)

Response (Success):
{
  "success": true,
  "message": "Logout Successful"
}

Response (Error):
{
  "success": false,
  "message": error.message
}

Cookies Cleared:
- token (cleared with same options)

Backend Operations:
1. Clear token cookie
```

#### 4. Check Authentication
```
GET /api/auth/is-auth
Authorization: JWT_TOKEN (via cookie)

Response (Success):
{
  "success": true,
  "message": "User is Authenticated"
}

Response (Error):
{
  "success": false,
  "message": "Not Unauthorized. Login Again" | error.message
}

Backend Operations:
1. Verify JWT token from cookie
2. Extract user ID from token
3. Return success if valid
```

#### 5. Send Email Verification OTP
```
POST /api/auth/send-verify-otp
Authorization: JWT_TOKEN (via cookie)
Content-Type: application/json

Request Body:
{} (empty, user ID extracted from token)

Response (Success):
{
  "success": true,
  "message": "OTP sent to your email"
}

Response (Error):
{
  "success": false,
  "message": "Account is already verified" | "User not found" | error.message
}

Backend Operations:
1. Verify JWT token
2. Extract user ID
3. Check if account already verified
4. Generate 6-digit random OTP
5. Save OTP to user.verifyotp
6. Set expiry to 24 hours from now
7. Send email with OTP via Brevo SMTP
```

#### 6. Verify Email Account
```
POST /api/auth/verify-account
Authorization: JWT_TOKEN (via cookie)
Content-Type: application/json

Request Body:
{
  "otp": "123456"
}

Response (Success):
{
  "success": true,
  "message": "Email Verified Successfully"
}

Response (Error):
{
  "success": false,
  "message": "User not found" | "Invalid Otp" | "Otp Expired" | "Missing Details" | error.message
}

Backend Operations:
1. Verify JWT token
2. Extract user ID
3. Get OTP from request body
4. Find user in MongoDB
5. Compare OTP with stored OTP
6. Check if OTP expired (24 hours)
7. If valid: Set isAccountVerified = true
8. Clear OTP fields
9. Save to MongoDB
```

#### 7. Send Password Reset OTP
```
POST /api/auth/send-reset-otp
Content-Type: application/json

Request Body:
{
  "email": "john@example.com"
}

Response (Success):
{
  "success": true,
  "message": "Otp sent to your email"
}

Response (Error):
{
  "success": false,
  "message": "User not found" | "Email is required" | error.message
}

Backend Operations:
1. Validate email present
2. Find user by email
3. Generate 6-digit OTP
4. Save OTP to user.resetotp (NOT verifyotp)
5. Set expiry to 15 minutes from now
6. Send email with OTP via Brevo SMTP
```

#### 8. Reset Password
```
POST /api/auth/reset-password
Authorization: JWT_TOKEN (via cookie)
Content-Type: application/json

Request Body:
{
  "email": "john@example.com",
  "otp": "123456",
  "newPassword": "newpassword123"
}

Response (Success):
{
  "success": true,
  "message": "Password Reset Successfully"
}

Response (Error):
{
  "success": false,
  "message": "User not found" | "Invalid Otp" | "Otp Expired" | "Missing Details" | error.message
}

Backend Operations:
1. Verify JWT token
2. Validate all inputs present
3. Find user by email
4. Compare OTP with stored resetotp
5. Check if OTP expired (15 minutes)
6. Hash new password with bcrypt
7. Update user password
8. Clear OTP fields
9. Save to MongoDB
```

### User Endpoints

#### 1. Get User Data
```
GET /api/user/data
Authorization: JWT_TOKEN (via cookie)

Response (Success):
{
  "success": true,
  "userData": {
    "name": "John Doe",
    "isAccountVerified": true
  }
}

Response (Error):
{
  "success": false,
  "message": "User not found" | error.message
}

Backend Operations:
1. Verify JWT token
2. Extract user ID
3. Find user by ID in MongoDB
4. Return name and verification status
```

---

## Authentication Flow

### Complete Server-Side Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│          SERVER-SIDE AUTHENTICATION FLOW                        │
└─────────────────────────────────────────────────────────────────┘

REGISTRATION FLOW:
──────────────────

User Request (POST /api/auth/register)
{name, email, password}
         │
         ▼
┌─────────────────────────────────────┐
│ Input Validation                    │
│ - Check all fields present          │
│ - Validate email format             │
└────────┬────────────────────────────┘
         │
    ┌────┴────┐
    │          │
    ▼          ▼
  ✓            ✗ (Missing Details)
  │            │
  │    ┌───────▼──────────────┐
  │    │ Return Error         │
  │    │ {success: false}     │
  │    └──────────────────────┘
  │
  ▼
┌──────────────────────────────────────┐
│ Check if User Exists                 │
│ Query: db.users.findOne({email})     │
└────────┬─────────────────────────────┘
         │
    ┌────┴────────┐
    │             │
    ▼             ▼
  null       Exists
  │          │
  │    ┌─────▼──────────────────┐
  │    │ Return Error           │
  │    │ "User Already Exists"  │
  │    └────────────────────────┘
  │
  ▼
┌──────────────────────────────────┐
│ Hash Password                    │
│ bcrypt.hash(password, 10 rounds) │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Create User Document             │
│ db.users.create({                │
│   name,                          │
│   email,                         │
│   password: hashedPassword,      │
│   verifyotp: "",                 │
│   isAccountVerified: false       │
│ })                               │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Generate JWT Token               │
│ jwt.sign({id}, JWT_SECRET)       │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Set Token in Cookie              │
│ httpOnly: true                   │
│ secure: true (production)        │
│ maxAge: 7 days                   │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Send Welcome Email               │
│ to: user.email                   │
│ template: WELCOME_EMAIL          │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Return Success Response          │
│ {                                │
│   success: true,                 │
│   message: "Registered"          │
│ }                                │
│ Cookie Set: token                │
└──────────────────────────────────┘


LOGIN FLOW:
───────────

User Request (POST /api/auth/login)
{email, password}
         │
         ▼
┌─────────────────────────────────┐
│ Input Validation                │
│ - Check email & password        │
└────────┬────────────────────────┘
         │
    ┌────┴────────┐
    │             │
    ▼             ▼
   ✓             ✗
   │             │
   │    ┌────────▼────────────┐
   │    │ Return Error        │
   │    │ Missing Required    │
   │    └────────────────────┘
   │
   ▼
┌─────────────────────────────────┐
│ Find User by Email              │
│ db.users.findOne({email})       │
└────────┬────────────────────────┘
         │
    ┌────┴────────┐
    │             │
    ▼             ▼
  Found        Not Found
   │             │
   │    ┌────────▼────────────┐
   │    │ Return Error        │
   │    │ "Invalid email"     │
   │    └────────────────────┘
   │
   ▼
┌─────────────────────────────────┐
│ Compare Password                │
│ bcrypt.compare(password,        │
│   user.password)                │
└────────┬────────────────────────┘
         │
    ┌────┴────┐
    │          │
    ▼          ▼
  Match    No Match
   │         │
   │    ┌────▼──────────────┐
   │    │ Return Error      │
   │    │ "Invalid password"│
   │    └──────────────────┘
   │
   ▼
┌─────────────────────────────────┐
│ Generate JWT Token              │
│ jwt.sign({id}, JWT_SECRET)      │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Set Token in Cookie             │
│ httpOnly: true                  │
│ secure: true (production)       │
│ maxAge: 7 days                  │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Return Success Response         │
│ {                               │
│   success: true,                │
│   message: "Login Successful"   │
│ }                               │
│ Cookie Set: token               │
└─────────────────────────────────┘


EMAIL VERIFICATION FLOW:
────────────────────────

User Request (POST /api/auth/send-verify-otp)
Authorization: JWT Token (in cookie)
         │
         ▼
┌──────────────────────────────────┐
│ Middleware: userAuth             │
│ 1. Extract token from cookies    │
│ 2. Verify JWT signature          │
│ 3. Decode and extract userId     │
│ 4. Attach userId to req.userId   │
└────────┬─────────────────────────┘
         │
    ┌────┴──────────┐
    │               │
    ▼               ▼
  Valid         Invalid/Missing
   │             │
   │    ┌────────▼──────────────┐
   │    │ Return 401            │
   │    │ "Not Unauthorized"    │
   │    └────────────────────────┘
   │
   ▼
┌──────────────────────────────────┐
│ Find User by ID                  │
│ db.users.findById(req.userId)    │
└────────┬─────────────────────────┘
         │
    ┌────┴──────────┐
    │               │
    ▼               ▼
  Found         Not Found
   │             │
   │    ┌────────▼──────────────┐
   │    │ Return Error          │
   │    │ "User not found"      │
   │    └────────────────────────┘
   │
   ▼
┌──────────────────────────────────┐
│ Check if Already Verified        │
│ if (user.isAccountVerified)      │
└────────┬─────────────────────────┘
         │
    ┌────┴────────────────┐
    │                     │
    ▼                     ▼
  false                  true
   │                      │
   │              ┌───────▼────────────┐
   │              │ Return Error       │
   │              │ "Already verified" │
   │              └────────────────────┘
   │
   ▼
┌──────────────────────────────────┐
│ Generate OTP                     │
│ otp = random 6-digit number      │
│ 100000 - 999999                  │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Save OTP to User                 │
│ user.verifyotp = otp             │
│ user.verifyotpExpireAt =         │
│   Date.now() + (24 * 60 * 60ms)  │
│ user.save()                      │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Send Email with OTP              │
│ transporter.sendMail({           │
│   to: user.email,                │
│   subject: "Verify Email OTP",   │
│   html: EMAIL_VERIFY_TEMPLATE    │
│ })                               │
└────────┬─────────────────────────┘
         │
    ┌────┴────────┐
    │             │
    ▼             ▼
 Success       Failure
   │             │
   │    ┌────────▼──────────────┐
   │    │ Return Error          │
   │    │ error.message         │
   │    └────────────────────────┘
   │
   ▼
┌──────────────────────────────────┐
│ Return Success Response          │
│ {                                │
│   success: true,                 │
│   message: "OTP sent to email"   │
│ }                                │
└──────────────────────────────────┘


User Request (POST /api/auth/verify-account)
{otp: "123456"}
Authorization: JWT Token
         │
         ▼
┌──────────────────────────────┐
│ Middleware: userAuth         │
│ Extract & verify JWT         │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Input Validation             │
│ Check userId & otp present   │
└────────┬─────────────────────┘
         │
    ┌────┴────┐
    │          │
    ▼          ▼
   ✓          ✗
   │          │
   │    ┌─────▼──────────────┐
   │    │ Return Error       │
   │    │ "Missing Details"  │
   │    └────────────────────┘
   │
   ▼
┌──────────────────────────────┐
│ Find User by ID              │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Compare OTP                  │
│ user.verifyotp === otp       │
└────────┬─────────────────────┘
         │
    ┌────┴────────┐
    │             │
    ▼             ▼
  Match        No Match
   │             │
   │    ┌────────▼──────────────┐
   │    │ Return Error          │
   │    │ "Invalid Otp"         │
   │    └────────────────────────┘
   │
   ▼
┌──────────────────────────────┐
│ Check OTP Expiry             │
│ if (now > expireAt)          │
└────────┬─────────────────────┘
         │
    ┌────┴────────┐
    │             │
    ▼             ▼
 Valid        Expired
   │             │
   │    ┌────────▼──────────────┐
   │    │ Return Error          │
   │    │ "Otp Expired"         │
   │    └────────────────────────┘
   │
   ▼
┌──────────────────────────────┐
│ Update User                  │
│ user.isAccountVerified=true  │
│ user.verifyotp = ""          │
│ user.verifyotpExpireAt = 0   │
│ user.save()                  │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Return Success Response      │
│ {                            │
│   success: true,             │
│   message: "Email Verified"  │
│ }                            │
└──────────────────────────────┘


PASSWORD RESET FLOW:
───────────────────

STEP 1: Send Reset OTP
User Request (POST /api/auth/send-reset-otp)
{email}
         │
         ▼
┌──────────────────────────────┐
│ Input Validation             │
│ Check email present          │
└────────┬─────────────────────┘
         │
    ┌────┴────┐
    │          │
    ▼          ▼
   ✓          ✗
   │          │
   │    ┌─────▼──────────────┐
   │    │ Return Error       │
   │    │ "Email required"   │
   │    └────────────────────┘
   │
   ▼
┌──────────────────────────────┐
│ Find User by Email           │
└────────┬─────────────────────┘
         │
    ┌────┴──────────┐
    │               │
    ▼               ▼
  Found         Not Found
   │             │
   │    ┌────────▼──────────────┐
   │    │ Return Error          │
   │    │ "User not found"      │
   │    └────────────────────────┘
   │
   ▼
┌──────────────────────────────┐
│ Generate Reset OTP           │
│ otp = random 6-digit         │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Save Reset OTP to User       │
│ user.resetotp = otp          │
│ user.resetotpExpireAt =      │
│   Date.now() + (15 * 60ms)   │
│ user.save()                  │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Send Reset Email             │
│ template: PASSWORD_RESET     │
│ with OTP embedded            │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Return Success Response      │
│ {                            │
│   success: true,             │
│   message: "OTP sent"        │
│ }                            │
└──────────────────────────────┘

STEP 2: Reset Password
User Request (POST /api/auth/reset-password)
{email, otp, newPassword}
Authorization: JWT Token
         │
         ▼
┌──────────────────────────────┐
│ Middleware: userAuth         │
│ Verify JWT token             │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Input Validation             │
│ Check all fields present     │
└────────┬─────────────────────┘
         │
    ┌────┴────┐
    │          │
    ▼          ▼
   ✓          ✗
   │          │
   │    ┌─────▼──────────────┐
   │    │ Return Error       │
   │    │ "Missing Details"  │
   │    └────────────────────┘
   │
   ▼
┌──────────────────────────────┐
│ Find User by Email           │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Compare Reset OTP            │
│ user.resetotp === otp        │
└────────┬─────────────────────┘
         │
    ┌────┴────────┐
    │             │
    ▼             ▼
  Match        No Match
   │             │
   │    ┌────────▼──────────────┐
   │    │ Return Error          │
   │    │ "Invalid Otp"         │
   │    └────────────────────────┘
   │
   ▼
┌──────────────────────────────┐
│ Check OTP Expiry             │
│ if (now > resetotpExpireAt)  │
└────────┬─────────────────────┘
         │
    ┌────┴────────┐
    │             │
    ▼             ▼
 Valid        Expired
   │             │
   │    ┌────────▼──────────────┐
   │    │ Return Error          │
   │    │ "Otp Expired"         │
   │    └────────────────────────┘
   │
   ▼
┌──────────────────────────────┐
│ Hash New Password            │
│ hashedPass = bcrypt.hash()   │
│ (10 salt rounds)             │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Update User Password         │
│ user.password = hashedPass   │
│ user.resetotp = ""           │
│ user.resetotpExpireAt = 0    │
│ user.save()                  │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Return Success Response      │
│ {                            │
│   success: true,             │
│   message: "Password Reset"  │
│ }                            │
└──────────────────────────────┘

```

---

## Email System

### Email Configuration

Brevo (formerly Sendinblue) is used for sending transactional emails.

**Configuration (.env):**
```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=989f36002@smtp-brevo.com
SMTP_PASS=xD7nyU3XNgjdBkpJ
BREVO_API_KEY=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
SENDER_EMAIL=ammardevelpor@gmail.com
```

### Email Types

#### 1. Welcome Email (Registration)
- **Trigger:** After user registration
- **Content:** Plain text welcome message
- **To:** User's email address
- **Subject:** "Welcome to Our Mern_Stack Platform!"

#### 2. Email Verification OTP
- **Trigger:** User requests email verification
- **Content:** HTML template with 6-digit OTP
- **To:** User's email address
- **Subject:** "Your Account Verification OTP"
- **Validity:** 24 hours
- **Template:** EMAIL_VERIFY_TEMPLATE

#### 3. Password Reset OTP
- **Trigger:** User initiates password reset
- **Content:** HTML template with 6-digit OTP
- **To:** User's email address
- **Subject:** "Your Password Reset OTP"
- **Validity:** 15 minutes
- **Template:** PASSWORD_RESET_TEMPLATE

### Email Templates

Templates are HTML-formatted with OTP placeholder:
```html
{{otp}}  <!-- Replaced with actual OTP -->
{{email}} <!-- Replaced with user's email -->
```

### Email Flow Diagram

```
Backend Event
     │
     ▼
┌─────────────────────────────────┐
│ Controller Function Called      │
│ (register, sendVerifyOtp, etc.) │
└─────┬───────────────────────────┘
      │
      ▼
┌─────────────────────────────────┐
│ Generate OTP (if needed)        │
│ Math.random() → 6-digit         │
└─────┬───────────────────────────┘
      │
      ▼
┌─────────────────────────────────┐
│ Save OTP to MongoDB             │
│ user.verifyotp = otp            │
│ user.save()                     │
└─────┬───────────────────────────┘
      │
      ▼
┌─────────────────────────────────┐
│ Load Email Template             │
│ Replace {{otp}} & {{email}}     │
└─────┬───────────────────────────┘
      │
      ▼
┌─────────────────────────────────┐
│ Call transporter.sendMail()     │
│ from: SENDER_EMAIL              │
│ to: user.email                  │
│ subject: [Type-specific]        │
│ html: [Template with OTP]       │
└─────┬───────────────────────────┘
      │
      ▼
┌─────────────────────────────────┐
│ Brevo SMTP Relay                │
│ Sends via smtp-relay.brevo.com  │
│ Port 587 (TLS)                  │
└─────┬───────────────────────────┘
      │
      ▼
┌─────────────────────────────────┐
│ Email Delivered to User Inbox   │
└─────────────────────────────────┘
```

---

## Middleware & Security

### JWT Token Middleware (userAuth)

Located at `/middleware/userAuth.js`

**Purpose:** Verify JWT token and extract user ID

**Flow:**
1. Extract token from cookies
2. If no token → Return 401 Unauthorized
3. Verify token signature using JWT_SECRET
4. Decode token to extract user ID
5. Attach userId to request object
6. Call next() to proceed to controller

**Code:**
```javascript
const userAuth = async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return res.json({
      success: false,
      message: "Not Unauthorized. Login Again",
    });
  }

  try {
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
    if (tokenDecode.id) {
      req.userId = tokenDecode.id;
    } else {
      return res.json({
        success: false,
        message: "Token is not Authorized, login again",
      });
    }
    next();
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
```

### CORS Configuration

**Allowed Origins:**
```javascript
const allowedOrigins = ['http://localhost:5173']

app.use(cors({
  origin: allowedOrigins,
  credentials: true  // Allow cookies
}));
```

### Cookie Security

**Settings:**
```javascript
res.cookie("token", token, {
  httpOnly: true,  // Prevent JavaScript access
  secure: process.env.NODE_ENV === "production", // HTTPS only in production
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});
```

### Password Security

**Bcrypt Hashing:**
- 10 salt rounds
- One-way hashing
- Same password generates different hash each time

```javascript
const hashedPassword = await bcrypt.hash(password, 10);
const isMatch = await bcrypt.compare(password, user.password);
```

---

## Configuration

### Environment Variables (.env)

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/demo234

# JWT
JWT_SECRET=mySuperSecretKey123456789

# Node Environment
NODE_ENV=development

# Brevo SMTP
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=989f36002@smtp-brevo.com
SMTP_PASS=xD7nyU3XNgjdBkpJ

# Brevo API Key
BREVO_API_KEY=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

# Email
SENDER_EMAIL=ammardevelpor@gmail.com

# Server
PORT=4000
```

---

## Running the Server

### Prerequisites
- Node.js v16+
- MongoDB running locally or remote connection
- Brevo account with verified sender email

### Installation

```bash
cd server
npm install
```

### Development Mode (with auto-restart)

```bash
npm run server
```

### Production Mode

```bash
npm start
```

### Expected Output

```
✓ MongoDB connected
✓ server started on PORT: 4000
```

---

## Error Handling

### Error Response Format

All errors return consistent JSON response:

```javascript
{
  "success": false,
  "message": "Error description"
}
```

### Common Errors

| Error | Cause | Resolution |
|-------|-------|-----------|
| "Missing Details" | Empty name/email/password | Provide all fields |
| "User Already Exists" | Email already registered | Use different email |
| "Invalid email" | Email not found | Check email spelling |
| "Invalid password" | Wrong password | Check password |
| "Otp Expired" | OTP older than validity period | Request new OTP |
| "Invalid Otp" | OTP doesn't match | Check OTP from email |
| "Not Unauthorized. Login Again" | Token missing/expired | User must login again |

---

## Deployment

### Environment Variables for Production

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=strong_random_secret_key_here
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_brevo_smtp_user
SMTP_PASS=your_brevo_smtp_password
BREVO_API_KEY=your_brevo_api_key
SENDER_EMAIL=your_verified_sender_email
PORT=5000
```

### Deployment Checklist

- [ ] Generate strong JWT_SECRET
- [ ] Use MongoDB Atlas (cloud) or secure MongoDB instance
- [ ] Verify sender email in Brevo
- [ ] Set NODE_ENV=production
- [ ] Update CORS allowedOrigins to production domain
- [ ] Enable secure cookies (secure: true)
- [ ] Use HTTPS
- [ ] Set strong password requirements
- [ ] Enable rate limiting on endpoints
- [ ] Monitor error logs
- [ ] Set up automated backups

### Popular Hosting Options

1. **Heroku**
   ```bash
   heroku create app-name
   heroku config:set MONGODB_URI=your_uri
   git push heroku main
   ```

2. **Railway**
   - Connect GitHub repo
   - Set environment variables
   - Auto-deploy on push

3. **Render**
   - Connect GitHub repo
   - Specify start command
   - Add environment variables

4. **AWS/GCP/Azure**
   - Deploy to EC2/App Engine/App Service
   - Configure MongoDB Atlas
   - Set up CI/CD pipeline

---

## Performance & Monitoring

### Database Indexing

Add indexes for frequently queried fields:

```javascript
userSchema.index({ email: 1 });  // Fast email lookup
userSchema.index({ createdAt: -1 });  // For sorting
```

### Logging

Implement logging for:
- API requests/responses
- Authentication attempts
- Email sending success/failure
- Database errors

### Rate Limiting

Implement on sensitive endpoints:
- `/api/auth/register` - 5 requests per hour
- `/api/auth/login` - 10 requests per hour
- `/api/auth/send-verify-otp` - 3 requests per hour

---

## Conclusion

The backend provides a secure, scalable authentication system with:
- Industry-standard JWT authentication
- Bcrypt password hashing
- Email verification system
- Password reset functionality
- MongoDB persistence
- Brevo email integration
- CORS protection
- HTTP-only cookies

For production use, ensure all security measures are in place and environment variables are properly configured.

