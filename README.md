# WebWynk CRM

A comprehensive Customer Relationship Management (CRM) application built with modern web technologies, tailored for managing administration, HR, and employee workflows.

## Features

- **Role-Based Access Control (RBAC):** Distinct dashboards and functionalities for Admin, HR, and Employees.
- **Authentication:** Secure user authentication and session management.
- **Dashboard & Analytics:** Real-time stats and metrics for administrators.
- **Activity Tracking:** Logging and tracking system activities.
- **Project & Task Management:** Project cards, deadline badges, and workflow tracking.
- **Database:** Relational data management using Prisma ORM.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/)
- **Language:** TypeScript
- **Styling:** Tailwind CSS / CSS Modules
- **Database ORM:** Prisma
- **UI Components:** Reusable custom UI components

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Environment Variables:**
   Copy `.env.example` to `.env.local` and `.env` and fill in your database and authentication secrets.

3. **Database Setup:**
   Run the Prisma migrations to set up your database schema.
   ```bash
   npx prisma migrate dev
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

- `/app`: Next.js App Router pages and API routes (Admin, HR, Employee).
- `/components`: Reusable UI components.
- `/lib` & `/utils`: Helper functions and shared logic.
- `/prisma`: Prisma schema and database setup.
- `/store`: State management.
- `/types`: TypeScript type definitions.

## Deployment

This project can be easily deployed to platforms like [Vercel](https://vercel.com/) or any Node.js hosting environment.
