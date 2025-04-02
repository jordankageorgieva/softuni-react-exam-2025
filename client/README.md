# SoftUni React Exam 2025 - Project System

This project is a React-based web application built with Vite, designed for managing projects and their associated data. It integrates Firebase Hosting and Google Cloud Run for backend services, providing a modern, scalable, and efficient architecture.

---

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Project Architecture](#project-architecture)
- [Technologies Used](#technologies-used)
- [Setup and Installation](#setup-and-installation)
- [Scripts](#scripts)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)

---

## Overview

The **SoftUni React Exam 2025 - Project System** is a full-stack application that allows users to:
- Manage projects and their associated data.
- Upload and retrieve images using IndexedDB for offline storage.
- Authenticate users via Firebase Authentication.
- Fetch and store data using a Google Cloud Run backend.

---

## Features

- **Project Management**: Create, edit, and delete projects.
- **Image Upload**: Upload project images and store them in IndexedDB for offline access.
- **Authentication**: Secure login and registration using Firebase Authentication.
- **Responsive Design**: Optimized for both desktop and mobile devices.
- **Cloud Integration**: Backend services hosted on Google Cloud Run.

---

## Project Architecture

The project follows a modular architecture with the following structure:

client/ ├── public/ # Static assets ├── src/ │ ├── components/ # React components │ │ ├── login-page/ # Login page components │ │ ├── create-page/ # Create project page components │ │ ├── details-page/ # Project details page components │ │ ├── game-edit/ # Edit project page components │ ├── services/ # API and IndexedDB service logic │ ├── hookContext/ # React Context for global state management │ ├── App.jsx # Main application entry point │ ├── main.jsx # Vite entry point ├── .env.production # Environment variables for production ├── firebase.json # Firebase Hosting configuration ├── package.json # Project dependencies and scripts



---

## Technologies Used

- **Frontend**:
  - React 19
  - React Router 7
  - Ant Design (UI components)
  - Vite (Build tool)

- **Backend**:
  - Google Cloud Run (Node.js backend)
  - Firebase Hosting (Static hosting)

- **Database**:
  - IndexedDB (Client-side storage for images)
  - Firebase Realtime Database (Data storage)

---

## Setup and Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/softuni-react-exam-2025.git
   cd softuni-react-exam-2025/client

2. Install dependencies:
    npm install

3. Set up environment variables:

Create .env.production in the client directory.
Add the following variables:

VITE_APP_SERVER_URL=https://your-cloud-run-service-url
VITE_APP_API_URL_DATA=https://your-cloud-run-service-url/data
VITE_APP_API_URL_JSONSTORE=https://your-cloud-run-service-url/jsonstore

4. Start the development server:
    npm run dev


Scripts
npm run dev: Start the development server.
npm run build: Build the project for production.
npm run preview: Preview the production build locally.
npm run deploy: Build and deploy the project to Firebase Hosting.


Environment Variables
The project uses the following environment variables:

VITE_APP_SERVER_URL: The base URL for the backend service.
VITE_APP_API_URL_DATA: The endpoint for project data.
VITE_APP_API_URL_JSONSTORE: The endpoint for JSON storage.


Deployment
1. Build the project:

npm run build

2. Deploy to Firebase Hosting:

firebase deploy

Ensure that Firebase Hosting is properly configured in firebase.json and that your backend service is accessible via Google Cloud Run.

License
This project is licensed under the MIT License. See the LICENSE file for details.



---

### How to Use:
1. Replace placeholders like `https://your-cloud-run-service-url` with your actual URLs.
2. Add any additional details specific to your project.

This documentation provides a clear overview of the project and its architecture, making it easy for others to understand and contribute.


URL: https://project-system-455609.web.app/



