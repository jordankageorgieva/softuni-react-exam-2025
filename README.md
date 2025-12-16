# SoftUni React Exam 2025

## Project Overview
This project is a React-based web application developed as part of the SoftUni React Exam 2025. It demonstrates the implementation of various React concepts, including routing, authentication, state management, and integration with external APIs. The application is designed to manage projects, certificates, and predictions for EUR/USD exchange rates.

## Features
- **Authentication**: Login and registration functionality with protected routes.
- **Project Management**:
  - Create, edit, and delete projects.
  - View project details and comments.
- **Certificates Page**:
  - Display a list of certificates with downloadable links.
- **EUR/USD Prediction**:
  - Predict EUR/USD exchange rates using a dedicated page.
- **Responsive Design**: Optimized for various screen sizes.

## Folder Structure
- `src/`
  - `api/`: Contains API-related logic (e.g., `authApi.js`).
  - `components/`: Contains React components for different pages and features.
  - `hookContext/`: Context for managing global state (e.g., `userContext.js`).
  - `services/`: Service files for handling business logic (e.g., `projectServices.js`).
  - `utils/`: Utility functions.
- `public/`: Static assets such as images.
- `vercel.json`: Configuration for deploying the app on Vercel.

## Deployment
The application is deployed on Vercel. You can access it at:
[https://softuni-react-exam-2025-test.vercel.app](https://softuni-react-exam-2025-test.vercel.app)

## How to Run Locally
1. Clone the repository:
   ```bash
   git clone <repository-url>
