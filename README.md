# Jurify

**A Next-Generation Legal Technology Platform**

Jurify is a comprehensive web application designed to bridge the gap between legal professionals and citizens. It streamlines legal document management, simplifies lawyer discovery, and facilitates secure collaboration through a modern, role-based ecosystem.

## 📋 Project Overview

Jurify provides dedicated portals for **Citizens**, **Lawyers**, **NGOs**, and **Admins**, each tailored with specific tools to enhance productivity and access to justice. The platform leverages modern web technologies to deliver a responsive, secure, and scalable solution for the legal industry.

---

## 🌟 Key Features

### 🏛️ Role-Based Portals
- **Citizens**: Search for lawyers, submit legal cases, track status, and manage documents.
- **Lawyers**: Accept/reject cases, manage client portfolios, and update verification details.
- **NGOs**: Collaborate on pro-bono cases, manage outreach programs, and support legal aid. Features include **Offline Mode** for availability management and a secure **Schedule Calendar**.
- **Admins**: Full platform oversight including user verification, content moderation, and system analytics.

### 💼 Case Management System
- **Submission**: Intuitive forms for citizens to submit legal grievances.
- **Tracking**: Real-time status updates (Pending, In Progress, Resolved).
- **Professional Finder**: Integrated "Find Lawyer/NGO" call-to-action for unassigned cases to quickly connect citizens with help.
- **History**: archival of past cases and legal interactions.

### 🔍 Smart Legal Directory
- **Advanced Search**: Filter lawyers by specialization (Criminal, Family, Corporate), location, and experience.
- **Profiles**: Detailed professional profiles with verification badges.
- **Geospatial Mapping**: Integrated Leaflet maps to visualize legal aid distribution.

### 🔐 Security & Identity
- **Authentication**: Robust JWT-based sessions and Google OAuth2 integration.
- **Verification Workflow**: Strict admin-led vetting process for lawyers and NGOs to prevent fraud.
- **Document Vault**: AWS S3 backed encrypted storage for sensitive legal files.
- **Privacy**: Role-based access control (RBAC) ensuring data is only visible to authorized parties.
- **Data Isolation**: Strict logic to prevent cross-account data leakage, ensuring NGOs only see appointments for their assigned cases.

### 💬 Communication & Collaboration
- **Direct Messaging**: Secure communication channels between clients and lawyers.
- **Video Conferencing**: Dual-strategy system using **Google Meet** (via Calendar integration) as the primary platform, with **Jitsi Meet** as a reliable fallback for unlinked accounts.
- **Notifications**: Automated email alerts for case updates and verification status.
- **Contact Support**: Integrated inquiry forms for platform assistance.

### 🤖 AI Legal Assistant (implemented)
- **RAG Powered**: Retrieval-Augmented Generation system using `sentence-transformers` and Cosine Similarity to provide accurate legal answers.
- **Vector Search**: Efficiently searches a knowledge base of Indian legal data to assist citizens.
- **Role-Aware**: Tailors responses based on whether the user is a Citizen, Lawyer, or NGO.

---

## 🔜 Implementation Roadmap (Future Ideas)

### 💳 Secure Payments
- **Payment Gateway**: Integration with Stripe/Razorpay for consultation fees and pro-bono donations.
- **Escrow**: Secure holding of funds until services are rendered.

### ⛓️ Blockchain Evidence
- **Immutable Logs**: Using blockchain to create tamper-proof records of submitted evidence and case history.
- **Smart Contracts**: Automated engagement letters and service agreements.

### 📱 Mobile Ecosystem
- **Native Apps**: React Native applications for iOS and Android.
- **Offline Mode**: Access to essential documents and contacts without internet.

### 🌍 Accessibility & Localization
- **Multi-language Support (i18n)**: Interface available in regional languages.
- **Voice Commands**: Voice-assisted navigation for differently-abled users.

### 📊 Advanced Analytics
- **Legal Trends**: Insights into common legal issues by region.
- **Performance Metrics**: Dashboard for lawyers to track case resolution rates.

---

## 🛠️ Tech Stack

### Backend (Robust & Scalable)
- **Framework**: Spring Boot 3.4.0 (Compatible with Java 21)
- **Language**: Java 21 LTS
- **Database**: PostgreSQL (Relational Data Persistence)
- **Security**: Spring Security, OAuth2 Client, JWT (jjwt 0.12.3)
- **Storage**: Cloudflare R2 (S3 Compatible Object Storage)
- **Real-time**: Spring WebSocket
- **Build Tool**: Maven

### Frontend (Modern & Reactive)
- **Framework**: React 19
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4
- **Routing**: React Router DOM 7
- **HTTP Client**: Axios
- **Maps**: Leaflet & React-Leaflet
- **Icons**: React Icons, Heroicons
- **Animations**: Framer Motion

### AI Services (RAG)
- **Language**: Python 3.10
- **Framework**: Flask
- **ML Models**: Sentence Transformers (`all-MiniLM-L6-v2`)
- **Server**: Gunicorn
- **Deployment**: Railway

### Infrastructure
- **Frontend Hosting**: Vercel
- **Backend & Database**: Railway
- **Object Storage**: Cloudflare R2
- **Email**: Gmail SMTP (Production Tuned)

---

## 🚀 Getting Started

### Prerequisites
- **Java 21 JDK**
- **Node.js 18+**
- **Python 3.10+** (For AI Service)
- **PostgreSQL 12+**
- **Maven 3.8+**

### 1️⃣ Backend Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Antrow15/Jurify.git
    cd Jurify/jurify_backend
    ```

2.  **Configure Environment**
    Update `src/main/resources/application.properties` with your credentials:

    ```properties
    # Database Configuration
    spring.datasource.url=jdbc:postgresql://localhost:5432/jurify
    spring.datasource.username=YOUR_DB_USER
    spring.datasource.password=YOUR_DB_PASSWORD

    # JPA / Hibernate
    spring.jpa.hibernate.ddl-auto=update

    # Mail Configuration (For Verification/Notifications)
    spring.mail.host=smtp.gmail.com
    spring.mail.port=587
    spring.mail.username=YOUR_EMAIL@gmail.com
    spring.mail.password=YOUR_APP_PASSWORD
    spring.mail.properties.mail.smtp.auth=true
    spring.mail.properties.mail.smtp.starttls.enable=true
    # Production Tuned Trust
    spring.mail.properties.mail.smtp.ssl.trust=*

    # Cloudflare R2 Configuration (S3 Compatible)
    cloudflare.r2.bucket=YOUR_BUCKET_NAME
    cloudflare.r2.access-key=YOUR_ACCESS_KEY
    cloudflare.r2.secret-key=YOUR_SECRET_KEY
    cloudflare.r2.endpoint=YOUR_R2_ENDPOINT

    # JWT Configuration
    jwt.secret=YOUR_VERY_LONG_SECRET_KEY
    
    # RAG Service Integration
    rag.service.url=http://localhost:8001
    
    # CORS
    cors.allowed.origins=*
    ```

3.  **Build and Run**
    ```bash
    mvn clean install
    mvn spring-boot:run
    ```
    *The server will start on `http://localhost:8080`.*

### 2️⃣ Frontend Setup

1.  **Navigate to frontend**
    ```bash
    cd ../jurify_frontend
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env` file in the `jurify_frontend` root:

    ```env
    VITE_API_BASE_URL=http://localhost:8080
    VITE_API_URL=http://localhost:8080/api
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```
    *The app will be accessible at `http://localhost:5173`.*

### 3️⃣ AI RAG Service Setup

1.  **Navigate to rag_service**
    ```bash
    cd ../rag_service
    ```

2.  **Install Python Dependencies**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Run the Service**
    ```bash
    python app.py
    ```
    *The RAG service will start on `http://localhost:8001`.*

---

## 📁 Project Structure

```
Jurify/
├── jurify_backend/       # Spring Boot Application (Core Logic)
│   ├── src/main/java     # Controllers, Services, Models
│   ├── src/main/resources# Config, Templates, Application Properties
│   └── pom.xml           # Maven Dependencies
│
├── jurify_frontend/      # React Application (UI)
│   ├── src/
│   │   ├── components/   # Chat, Maps, Dashboard, Settings
│   │   ├── pages/        # Landing, Login, Register
│   │   ├── services/     # API Integration & WebSocket
│   │   └── context/      # Auth & Notification State
│   └── vite.config.js    # Build Configuration
│
├── rag_service/          # Python AI Microservice (New)
│   ├── app.py            # Flask Endpoint
│   ├── knowledge.json    # Legal Knowledge Base
│   └── Dockerfile        # AI Container Config
│
└── README.md             # Project Documentation
```

---

## 🤝 Contributing

Contributions are welcome!

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Authors

-   **Antrow15** - *Project Lead & Full Stack Developer*
-   **DharunKumar-V** - *Backend Developer*
-   **siddhuoo** (siddhesh kumbhar) - *Backend Developer*
-   **Sriraksha-16** - *Backend Developer*
-   **Devadharshini152** - *Frontend Developer*
-   **Divyanshu-2907** (Divyanshu Kumar) - *Frontend Developer*
-   **Rijithaa** (Rijithaa A R) - *Frontend Developer*
