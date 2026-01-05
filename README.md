# Secure Task Management System

A full-stack task management system built in an NX monorepo with role-based access control (RBAC), JWT authentication, and an Angular dashboard. This repo was created for a time-boxed (8 hours) full-stack challenge focused on secure, scoped task access across organizations.

Repository naming convention used: first initial + last name + UUID (e.g., `jdoe-0a19fc14-d0eb-42ed-850d-63023568a3e3`).

## 🏗️ Architecture Overview

This project is structured as an NX monorepo with the following components:

### Monorepo Structure

```
├── apps/
│   ├── api/          # NestJS backend application
│   └── dashboard/    # Angular frontend application
├── libs/
│   ├── data/         # Shared TypeScript interfaces & DTOs
│   └── auth/         # Reusable RBAC logic, decorators, and guards
```

### Rationale

- **Shared Libraries**: The `data` and `auth` libraries promote code reuse and ensure type safety across the frontend and backend
- **Modular Architecture**: Each app is self-contained but shares common types and utilities
- **Type Safety**: TypeScript interfaces are shared between frontend and backend, reducing errors

## 📊 Data Model

### Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐
│   User      │─────────│ Organization │
│             │         │              │
│ - id        │         │ - id         │
│ - email     │         │ - name       │
│ - password  │         │ - parentId   │
│ - role      │         └──────────────┘
│ - orgId     │                │
└─────────────┘                │
       │                       │
       │                       │
┌─────────────┐         ┌──────────────┐
│   Task      │─────────│  AuditLog    │
│             │         │              │
│ - id        │         │ - id         │
│ - title     │         │ - userId     │
│ - status    │         │ - action     │
│ - category  │         │ - resource   │
│ - priority  │         │ - resourceId │
│ - orgId     │         │ - createdAt  │
└─────────────┘         └──────────────┘
```

### Schema Details

#### Users
- **Roles**: Owner, Admin, Viewer
- **Organization**: Each user belongs to one organization
- **Authentication**: Password is hashed using bcrypt

#### Organizations
- **Hierarchy**: 2-level hierarchy (parent-child relationships)
- **Access Control**: Users can access resources in their org and child orgs (based on role)

#### Tasks
- **Status**: todo, in_progress, done
- **Priority**: low, medium, high
- **Category**: User-defined categories (e.g., "Work", "Personal")
- **Order**: For sorting and drag-and-drop functionality

#### Audit Logs
- **Tracking**: All user actions are logged
- **Access**: Only Owner and Admin can view audit logs
- **Details**: Includes IP address, user agent, and action details

## 🔐 Access Control Implementation

### Role-Based Permissions

| Role   | Create | Read | Update | Delete | View Audit Log |
|--------|--------|------|--------|--------|----------------|
| Owner  | ✅     | ✅   | ✅     | ✅     | ✅             |
| Admin  | ✅     | ✅   | ✅     | ✅     | ❌             |
| Viewer | ❌     | ✅   | ❌     | ❌     | ❌             |

Role inheritance is modeled through permissions: Owner/Admin include all Viewer read capabilities plus elevated privileges.

### Organization Hierarchy

- **Owner/Admin**: Can access tasks in their organization and all child organizations
- **Viewer**: Can only access tasks in their own organization
- **Modification**: Only Owner and Admin can create, update, or delete tasks

### JWT Authentication Flow

1. User logs in with email/password
2. Backend validates credentials and returns JWT token
3. Frontend stores token in localStorage
4. All API requests include token in Authorization header
5. Backend validates token on each request
6. User information is extracted from token and attached to request

### RBAC Guards and Decorators

- **@RequirePermissions()**: Decorator to specify required permissions for endpoints
- **PermissionsGuard**: Validates user has required permissions
- **JwtAuthGuard**: Validates JWT token and attaches user to request
- **RbacService**: Service containing business logic for access control

## 🚀 Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- SQLite (included with Node.js)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   DATABASE_PATH=task-management.db
   ```
   Notes:
   - `JWT_SECRET` is required. A non-empty value must be provided.
   - `DATABASE_PATH` is optional and defaults to `task-management.db` (SQLite).

3. **Seed the database**
   ```bash
   npm run seed
   ```
   
   This creates:
   - 2 organizations (parent and child)
   - 3 users:
     - Owner: `owner@acme.com` / `owner123`
     - Admin: `admin@acme.com` / `admin123`
     - Viewer: `viewer@acme.com` / `viewer123`
   - 4 sample tasks

### Running the Applications

#### Backend (API)

```bash
npm run serve:api
```

The API will be available at `http://localhost:3000`

#### Frontend (Dashboard)

```bash
npm run serve:dashboard
```

The dashboard will be available at `http://localhost:4200`

### Running Tests

```bash
# Run all tests
npm test

# Run backend tests only
nx test api

# Run frontend tests only
nx test dashboard

# Run library tests
nx test auth
nx test data
```

## 📡 API Documentation

### Base URL
```
http://localhost:3000
```

### Authentication

All endpoints (except `/auth/login`) require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Endpoints

#### POST /auth/login
Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "owner@acme.com",
  "password": "owner123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "owner@acme.com",
    "firstName": "John",
    "lastName": "Owner",
    "role": "Owner",
    "organizationId": 1
  }
}
```

#### POST /tasks
Create a new task. Requires `create:task` permission.

**Request:**
```json
{
  "title": "New Task",
  "description": "Task description",
  "category": "Work",
  "priority": "high",
  "status": "todo"
}
```

**Response:**
```json
{
  "id": 1,
  "title": "New Task",
  "description": "Task description",
  "status": "todo",
  "category": "Work",
  "priority": "high",
  "createdById": 1,
  "organizationId": 1,
  "order": 0,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### GET /tasks
List all accessible tasks. Requires `read:task` permission.

**Response:**
```json
[
  {
    "id": 1,
    "title": "Task 1",
    "status": "todo",
    "category": "Work",
    "priority": "high",
    "createdById": 1,
    "organizationId": 1,
    "order": 0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### PUT /tasks/:id
Update a task. Requires `update:task` permission and access to the task.

**Request:**
```json
{
  "title": "Updated Task",
  "status": "in_progress",
  "priority": "medium"
}
```

**Response:**
```json
{
  "id": 1,
  "title": "Updated Task",
  "status": "in_progress",
  "priority": "medium",
  ...
}
```

#### DELETE /tasks/:id
Delete a task. Requires `delete:task` permission and access to the task.

**Response:**
```
204 No Content
```

#### GET /audit-log
View audit logs. Requires `read:audit-log` permission (Owner/Admin only).

**Response:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "action": "CREATE",
    "resource": "task",
    "resourceId": 1,
    "details": "Created task: New Task",
    "ipAddress": "127.0.0.1",
    "userAgent": "Mozilla/5.0...",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```