# Jurify

A comprehensive legal technology platform designed to streamline legal document management, research, and collaboration.

## 📋 Project Overview

Jurify is a full-stack web application that provides legal professionals with tools for document management, case research, and team collaboration. The platform leverages modern web technologies to deliver a responsive, secure, and scalable solution.

## 🛠️ Tech Stack

### Backend
- **Framework**: Spring Boot 4.0.0
- **Language**: Java 21
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Token)
- **Authorization**: OAuth2
- **Real-time Communication**: WebSocket
- **Cloud Storage**: AWS S3
- **Build Tool**: Maven

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Routing**: React Router
- **Mapping**: Leaflet
- **Icons**: React Icons

## 🚀 Getting Started

### Prerequisites
- Java 21 (Backend)
- Node.js 18+ (Frontend)
- PostgreSQL 12+
- Maven
- npm or yarn

### Backend Setup

1. Clone the repository
```bash
git clone https://github.com/Antrow15/Jurify.git
cd Jurify
```

2. Navigate to the backend directory
```bash
cd jurify_backend
```

3. Configure PostgreSQL connection in `application.properties` or `application.yml`
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/jurify
spring.datasource.username=your_username
spring.datasource.password=your_password
```

4. Build and run the application
```bash
mvn clean install
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

### Frontend Setup

1. Navigate to the frontend directory
```bash
cd jurify_frontend
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file with your API configuration
```env
VITE_API_BASE_URL=http://localhost:8080
```

4. Start the development server
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **OAuth2 Integration**: Third-party authentication support
- **WebSocket Security**: Secure real-time communication
- **AWS S3 Integration**: Secure document storage with S3

## 📦 Core Features

- **Document Management**: Upload, organize, and manage legal documents
- **Search & Filtering**: Advanced search and filtering capabilities
- **Real-time Collaboration**: WebSocket-based real-time updates
- **Map Integration**: Location-based legal research using Leaflet
- **User Management**: OAuth2 and JWT-based user authentication
- **Cloud Storage**: Secure document storage using AWS S3

## 📁 Project Structure

```
Jurify/
├── jurify_backend/
│   ├── src/
│   ├── pom.xml
│   ├── mvnw
│   └── ...
├── jurify_frontend/
│   ├── src/
│   ├── vite.config.js
│   ├── package.json
│   ├── index.html
│   └── ...
└── README.md
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
3. Push to the branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **Antrow15** - Initial work and project lead

## 📞 Support

For support, please open an issue on the GitHub repository or contact the development team.

---

**Last Updated**: December 14, 2025