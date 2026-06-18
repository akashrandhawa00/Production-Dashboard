# EcoTrack

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=black)
![Recharts](https://img.shields.io/badge/Recharts-Charts-FF6384?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

> A real-time production monitoring dashboard for an industrial ecoating/electrocoating line — built to replace manual tracking with a role-gated, data-driven web application.

---

## Overview

EcoTrack is a full-stack production dashboard developed for an active ecoating finishing plant. It enables floor staff, supervisors, and administrators to log, track, and analyze production runs across multiple part numbers — all in real time.

The project was built as a portfolio flagship to demonstrate production-grade React patterns, Supabase integration, and role-based access control in a real-world industrial context.

---

## Features

### Role-Based Access Control
Three distinct roles with scoped permissions:

| Role | Capabilities |
|---|---|
| **Material Handler** | Log production runs, view own entries |
| **Supervisor** | View all entries, access analytics, export data |
| **Admin** | Full access including user management and settings |

### Production Logging
- Multi-part-number logging per run
- Timestamped entries with operator attribution
- Form validation and error handling

### Real-Time Dashboard
- Live production feed via Supabase real-time subscriptions
- KPI cards for daily output, defect rate, and throughput
- Date range filtering for historical analysis

### Analytics & Reporting
- Interactive charts powered by Recharts
- CSV export for supervisor and admin roles
- Trend visualization across shifts and part numbers

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Auth & Database | Supabase (PostgreSQL + Row Level Security) |
| Charts | Recharts |
| State Management | React Context + useReducer |
| Routing | React Router v6 |
| Language | JavaScript (TypeScript migration in progress) |

---

## Project Structure

```
src/
├── components/
│   ├── auth/          # Login, role guards
│   ├── dashboard/     # KPI cards, production feed
│   ├── forms/         # Production log entry forms
│   ├── charts/        # Recharts wrappers
│   └── layout/        # Navbar, sidebar, shell
├── context/           # Auth context, app state
├── hooks/             # Custom React hooks
├── lib/               # Supabase client, helpers
├── pages/             # Route-level page components
└── types/             # Shared type definitions
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)

### Installation

```bash
git clone https://github.com/akashrandhawa00/Production-Dashboard.git
cd ecotrack
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Run Locally

```bash
npm run dev
```


---

## Database Schema

The app uses Supabase with Row Level Security (RLS) policies enforcing role-based data access.

Key tables:

- `profiles` — User roles and metadata (linked to Supabase Auth)
- `production_logs` — Individual run entries with part numbers, quantities, and timestamps
- `part_numbers` — Reference table for tracked SKUs

RLS policies ensure Material Handlers can only read/write their own entries, while Supervisors and Admins have broader access.

---

## Roadmap

- [x] Role-based authentication (Material Handler / Supervisor / Admin)
- [x] Multi-part-number production logging
- [x] 28-component architecture with reusable UI primitives
- [ ] Supabase integration with RLS policies
- [ ] Real-time subscriptions for live dashboard updates
- [ ] Date range filtering
- [ ] CSV export
- [ ] Recharts analytics views
- [ ] TypeScript migration
- [ ] Responsive / mobile layout

---

## Motivation

Manual shift tracking in manufacturing environments is error-prone and slow. EcoTrack was designed to digitize that process — giving production teams immediate visibility into output, and giving supervisors the data they need without waiting for end-of-shift reports.


