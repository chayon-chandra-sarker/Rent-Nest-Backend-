# 🏠 RentNest Backend

A secure and scalable REST API for a Rental Property Management System built with **Node.js**, **Express.js**, **TypeScript**, **PostgreSQL**, and **Prisma ORM**.

This backend allows **Admins**, **Landlords**, and **Tenants** to manage rental properties, rental requests, payments, and user accounts through role-based authentication.

---

## 🚀 Live API

> Add your deployed backend URL here

```
https://your-backend-url.com
```

---

## 📌 Features

### 🔐 Authentication & Authorization
- JWT Authentication
- Role-based Access Control (Admin, Landlord, Tenant)
- Password Hashing with bcrypt
- Protected Routes

### 👤 User Management
- User Registration
- Login
- Get My Profile
- Update My Profile
- Admin can manage users
- Admin can update user roles

### 🏷️ Category Management
- Create Category (Admin)
- Get All Categories
- Get Single Category
- Update Category (Admin)
- Delete Category (Admin)

### 🏡 Property Management
- Create Property (Landlord)
- Get All Properties
- Get Property Details
- Update Own Property
- Delete Own Property
- Property Filtering & Searching

### 📄 Rental Request
- Tenant can request rental
- Tenant can view own requests
- Landlord can view received requests
- Landlord can approve/reject requests

### 💳 Payment
- Stripe one time Payment Integration
- Payment Verification
- Payment History
- Admin can view all payments

### 📊 Dashboard
Admin Dashboard includes:

- Total Users
- Total Properties
- Total Rental Requests
- Total Revenue
- Completed Payments

---

# 🛠 Tech Stack

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT
- bcrypt
- Stripe
- Zod
- ESLint
- Prettier

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/your-username/RentNest-Backend.git
```

```bash
cd RentNest-Backend
```

## Install Dependencies

```bash
npm install
```

## Setup Environment Variables

Create a `.env` file

```env
PORT=5000

DATABASE_URL=

JWT_ACCESS_SECRET=

JWT_ACCESS_EXPIRES_IN=7d

BCRYPT_SALT_ROUNDS=10

STRIPE_SECRET_KEY=

CLIENT_URL=
```

---

# 🗄 Database

Generate Prisma Client

```bash
npx prisma generate
```

Run Migration

```bash
npx prisma migrate dev
```

Open Prisma Studio

```bash
npx prisma studio
```

---

# ▶️ Run Project

Development

```bash
npm run dev
```

Production

```bash
npm run build
```

```bash
npm start
```

---

# 📮 API Modules

## Authentication

- POST /auth/register
- POST /auth/login

## Users

- GET /users
- GET /users/me
- PATCH /users/me
- PATCH /users/role/:id

## Categories

- POST /categories
- GET /categories
- GET /categories/:id
- PATCH /categories/:id
- DELETE /categories/:id

## Properties

- POST /properties
- GET /properties
- GET /properties/:id
- PATCH /properties/:id
- DELETE /properties/:id

## Rental

- POST /rental
- GET /rental/my
- GET /rental/landlord
- PATCH /rental/:id/status

## Payment

- POST /payment/create-intent
- POST /payment/confirm
- GET /payment/my
- GET /payment

## Dashboard

- GET /dashboard/admin

---

# 🔒 User Roles

| Role | Permissions |
|------|-------------|
| Admin | Manage everything |
| Landlord | Manage own properties & rental requests |
| Tenant | Browse properties, request rentals & make payments |

---

# ✅ Validation

- Zod Validation
- Global Error Handler
- Standard Response Format
- HTTP Status Codes

---

# 🚀 Deployment

Deploy easily on:

- Render
- Railway
- VPS

---

# 👨‍💻 Author

**Chayon Sarker**

GitHub:
https://github.com/your-github

LinkedIn:
https://linkedin.com/in/your-linkedin

Postman Docs:
https://enterprise-rent-a-car.docs.buildwithfern.com/rent-nest/get-user/get-profile

---

# 📜 License

This project is licensed under the MIT License.