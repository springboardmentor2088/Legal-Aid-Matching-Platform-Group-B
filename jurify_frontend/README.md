# ⚖️ Jurify - Pro Bono Legal Aid Platform

![Build Status](https://img.shields.io/badge/build-passing-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue) ![Version](https://img.shields.io/badge/version-1.0.0-orange)

**Jurify** is a centralized web platform dedicated to bridging the justice gap by connecting specialized pro bono lawyers with citizens in need. By digitizing the legal aid process, Jurify ensures transparency, accessibility, and efficiency for all stakeholders including Citizens, Lawyers, and NGOs.

---

## 🌟 Key Features

### 👤 For Citizens
- **Secure Registration**: Register with personal details and upload ID proofs securely.
- **Location-Based Services**: Integrated **Leaflet Maps** to pin-point precise location for finding nearby legal help.
- **Case Dashboard**: View legal case status and history.
- **Legal Aid Access**: Directly request pro bono assistance from verified professionals.

### 🧑‍⚖️ For Lawyers
- **Professional Profile**: Showcase Bar Council credentials, specialization, and experience.
- **Bar Council Verification**: Automated workflow for validating Bar Council ID and enrollment year.
- **Case Management**: Dedicated dashboard (`/lawyer/dashboard`) to manage assigned pro bono cases.
- **Impact Tracking**: View statistics on cases handled and lives impacted.

### 🏢 For NGOs
- **Organization Onboarding**: Register with tracking of Darpan ID and Registration Numbers.
- **Legal Aid Coordination**: Manage multiple legal aid requests on behalf of beneficiaries.
- **Verification Workflow**: Upload organization registration certificates for Admin approval.

### 🛡️ Admin & Governance
- **User Verification System**: 
  - Dedicated interface to review pending verification requests (`/api/verification/pending`).
  - Capablity to **Approve** or **Reject** Lawyers and NGOs based on submitted documents.
- **Platform Oversight**: Monitor user registrations and platform activity.

---

## 🛠️ Technical Architecture

### Frontend (Client-Side)
Building a modern, responsive, and fast SPA (Single Page Application).

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite 7](https://vitejs.dev/) - For lightning-fast builds and HMR.
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) - Utility-first styling with a custom design system.
- **Routing**: [React Router DOM v7](https://reactrouter.com/) - Client-side routing with protected route guards.
- **Maps**: [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/) - Open-source interactive maps.
- **State Management**: Context API (`AuthContext`, `ThemeContext`).
- **HTTP Client**: [Axios](https://axios-http.com/) - For REST API communication.

### Backend (Server-Side)
Robust, secure, and scalable REST API.

- **Framework**: [Spring Boot 3](https://spring.io/projects/spring-boot) (Java 17+)
- **Security**: **Spring Security** with **JWT** (JSON Web Tokens) for stateless authentication.
- **Database**: **MySQL** - Relational database for structured data consistency.
- **ORM**: **Spring Data JPA** (Hibernate) - For efficient database interactions.
- **Validation**: Jakarta Validation API - For rigid input data validation.
- **Build Tool**: Maven

---

## 📂 Project Structure

```bash
Jurify/
├── jurify_backend/             # Spring Boot Application
│   ├── src/main/java/          # Source Code (Controllers, Services, Models)
│   ├── src/main/resources/     # Configuration (application.properties)
│   └── pom.xml                 # Maven Dependencies
│
└── jurify_frontend/            # React + Vite Application
    ├── src/
    │   ├── components/         # Reusable UI components & Pages
    │   │   ├── pages/          # Dashboards (Citizen, Lawyer, Admin)
    │   │   └── Register/       # Registration Forms
    │   ├── context/            # Global State (Auth, Theme)
    │   └── services/           # API Service modules
    ├── index.css               # Tailwind directives
    └── package.json            # NPM Dependencies
```

---

## � Installation & Setup Guide

### Prerequisites
Ensure you have the following installed on your machine:
- **Node.js** (v18+) & **npm**
- **Java JDK** (v17+)
- **MySQL Server**

### Step 1: Database Configuration
1. Login to your MySQL instance.
2. Create the database:
   ```sql
   CREATE DATABASE jurify_db;
   ```

### Step 2: Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd jurify_backend
   ```
2. Configure your database credentials in `src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/jurify_db
   spring.datasource.username=YOUR_USERNAME
   spring.datasource.password=YOUR_PASSWORD
   # Check JWT Secret config if applicable
   ```
3. Run the application:
   ```bash
   ./mvnw spring-boot:run
   ```
   🚀 Server will start at `http://localhost:8080`.

### Step 3: Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd jurify_frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   🌐 Application will be live at `http://localhost:5173`.

---

## 📚 Implemented Modules & Features

### 1. Authentication & Security
- **OAuth2 / OIDC**: Google Login integration (`CustomOAuth2UserService`).
- **JWT Authentication**: Implementation of Access Token & Refresh Token rotation.
- **Role-Based Access Control (RBAC)**: Secure routes for `CITIZEN`, `LAWYER`, `NGO`, and `ADMIN`.
- **Password Security**: BCrypt hashing and password strength validation.

### 2. User Registration & Onboarding
- **Citizen Registration**:
  - Personal details, Gender, DOB validation.
  - Interactive Map for location selection.
  - ID Proof file upload (Blob storage).
- **Lawyer Registration**:
  - Bar Council ID & State enrollment verification.
  - Professional bio, experience, and specialization details.
  - Organization/Firm association.
- **NGO Registration**:
  - Darpan ID & Registration Certificate upload.
  - Legal Aid commitment tracking.

### 3. User Dashboards
- **Citizen Dashboard** (`/citizen/dashboard`):
  - Profile management (Edit/Update details).
  - Status tracking of legal requests.
- **Lawyer Dashboard** (`/lawyer/dashboard`):
  - Manage professional profile.
  - "My Cases" view for assigned pro bono work.
  - Performance stats (Lives Impacted, Pro Bono Hours).
- **Admin Dashboard** (`/admin/dashboard`):
  - **Verification Center**: View pending verification requests.
  - **Approval Workflow**: Approve or Reject users with reason.
  - **User Management**: List all registered users (Citizens, Lawyers, NGOs).

### 4. Verification System
- **Document Verification**: Admin review of uploaded ID proofs and certificates.
- **Status Updates**: Real-time email notifications for account approval/rejection (`EmailService`).
- **Polling Mechanism**: Frontend polls for verification status updates during registration.

### 5. Backend Services (`com.jurify.service`)
- `AuthenticationService`: Handles login, register, token generation.
- `RegistrationService`: Manages role-specific data persistence.
- `VerificationService`: core logic for Admin verification workflows.
- `LegalCaseService`: Manages case lifecycle (Create, Read, Update).
- `CloudflareR2Service`: (Experimental) Integration for external file storage.

---

## 🔌 API Documentation Summary

The backend exposes several key REST endpoints. Here are the primary controllers:

| Controller | Base Path | Description |
| :--- | :--- | :--- |
| **Auth** | `/api/auth` | Login, Role-selection, JWT generation. |
| **Registration** | `/api/register` | Specific endpoints for Citizen, Lawyer, and NGO registration. |
| **Verification** | `/api/verification` | Submit proofs, Admin approval/rejection logic. |
| **Cases** | `/api/cases` | CRUD operations for legal cases (`GET`, `POST`). |
| **User** | `/api/users` | profile management and data retrieval. |

---

## 🤝 Contributing

We welcome contributions to improve access to justice!

1.  **Fork** the repository.
2.  Create a **Feature Branch** (`git checkout -b feature/NewFeature`).
3.  **Commit** your changes (`git commit -m 'Add NewFeature'`).
4.  **Push** to the branch (`git push origin feature/NewFeature`).
5.  Open a **Pull Request**.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

_Built with ❤️ for Justice._
