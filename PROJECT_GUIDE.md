# SweepDreams Project Guide

This project is a small booking app for a cleaning service. Think of it as a website where a customer can:

- sign up / log in
- choose a cleaning service
- book a time slot
- see their booking history
- cancel or leave feedback
- and an admin can confirm, complete, or cancel bookings

You do not need to be a programmer to read this project. The goal of this guide is to explain what each folder and file is for in plain English.

---

## 1) The big picture

This repo has two main parts:

- backend/ — the server and business logic
- frontend/ — the browser-side helper code for calling the server

The app is built with JavaScript and runs with Node.js, Express, and MongoDB.

A very simple way to think about it:

- frontend = what the user sees and clicks
- backend = the logic and database behind the scenes
- database = the place where bookings, users, and sessions are stored

---

## 2) Folder breakdown

### backend/

This is the main app logic.

#### backend/package.json
This file tells Node.js and npm what the project is, what dependencies it needs, and what commands can run.

Important scripts:

- `npm run dev` → starts the backend server
- `npm run demo` → runs the app with a temporary in-memory database
- `npm test` → runs the API tests

This file is basically the project's recipe card.

#### backend/.env.example
This is a sample environment file.

It lists variables like:

- `MONGO_URI` — where the MongoDB database lives
- `DB_NAME` — the database name
- `ADMIN_KEY` — the secret admin password
- `PORT` — the port number for the server

You usually copy this into a real `.env` file with actual values.

#### backend/server/
This folder contains the actual server code.

#### backend/server/index.js
This is the server startup file.

It does the following:

- loads environment variables
- connects to MongoDB
- creates the Express app
- runs the app on a local port
- serves the frontend if a build exists
- if not, runs Vite in development mode for the frontend

This is basically the app's "main entry point".

#### backend/server/app.js
This is the core business logic file.

It creates the API routes for the app, such as:

- `/api/config` — returns service pricing and options
- `/api/availability` — checks which time slots are free
- `/api/bookings` — creates a booking
- `/api/account/bookings` — gets a user's bookings
- `/api/admin/bookings` — lets admin see all bookings
- `/api/admin/bookings/:id` — updates booking status

This file also contains validation rules like:

- date must be valid
- slots cannot conflict
- only certain payment methods are allowed
- incomplete checklist items are rejected
- only the right user can access their own booking

If you only read one file in this project, read this one first.

#### backend/server/auth.js
This file handles authentication.

It manages:

- user signup
- login
- logout
- session cookies
- password hashing
- rate limiting for repeated failed attempts

Important ideas:

- passwords are never stored in plain text
- they are hashed with a secure method
- the app uses a cookie named `sweep_session` to remember who is logged in

This is the security layer for user accounts.

#### backend/tests/api.test.js
This is the test file.

It verifies the API works as expected and checks things like:

- login is required before booking
- a user cannot access someone else's booking
- duplicate bookings are rejected
- admin routes are blocked without the correct secret key
- feedback can only be added once after completion

Tests are important because they act like checklists to make sure the app still works after changes.

---

## 3) Frontend folder

### frontend/src/api.js
This file is tiny but important.

It wraps common browser requests in a helper function:

- `api(path, options)` sends requests to `/api...`
- it parses JSON responses
- if the server returns an error, it throws a readable error

It also has:

- `remember(access)` — saves user session info in browser storage
- `clock(t)` — turns a time like `09:00` into `9:00 AM`
- `pesos(n)` — formats numbers as Philippine pesos

This is the bridge between the browser and the backend API.

---

## 4) How the app works in plain English

### User flow

1. A user signs up with name, email, and password.
2. The server saves the user in MongoDB and creates a session cookie.
3. The user books a cleaning slot by sending details like date, room, and time.
4. The backend validates the data and checks whether that slot is free.
5. The booking is saved to the database.
6. An admin can confirm the booking and assign a cleaner.
7. When the cleaning is complete, the admin marks it completed.
8. The user can leave feedback once.

### Admin flow

The admin route is protected by an authorization header with a secret key.

This prevents ordinary users from accidentally or intentionally changing bookings.

---

## 5) What is MongoDB doing here?

MongoDB is the database system. Think of it as a structured storage box.

This app stores:

- user accounts
- login sessions
- bookings
- status updates like pending / confirmed / completed
- feedback

The backend fetches and stores data using MongoDB queries.

---

## 6) What is Express?

Express is a simple web framework for Node.js.

It lets the code define routes like:

- GET a page
- POST new data
- PATCH update data

In this project, Express handles API requests and response codes like 200, 201, 400, 401, 404, and 409.

---

## 7) What is Node.js?

Node.js is the runtime that runs JavaScript outside the browser. It powers the server.

This project is a backend app written in JavaScript, not a browser-only website. The server runs on your machine or a server environment and handles requests.

---

## 8) What is a route?

A route is a URL path that the server responds to.

Example:

- `/api/auth/signup` — create a new user
- `/api/auth/login` — log in
- `/api/availability` — get open slots
- `/api/bookings` — create a booking

You can think of routes as different pages or actions in an API.

---

## 9) How to read this repo without feeling overwhelmed

If you are brand new to coding, the easiest way is:

1. Start with `backend/server/index.js` — this tells you how the app boots
2. Then read `backend/server/app.js` — this is the main feature logic
3. Then read `backend/server/auth.js` — this is the login/security part
4. Then read `backend/tests/api.test.js` — this shows what the app is expected to do
5. Finally read `frontend/src/api.js` — this shows how the browser talks to the backend

You do not need to memorize all syntax. Just understand the purpose of each file.

---

## 10) Quick summary table

| File/folder | What it does |
| --- | --- |
| `backend/` | Main application server |
| `backend/package.json` | Project scripts and dependencies |
| `backend/.env.example` | Example environment variables |
| `backend/server/index.js` | Starts MongoDB and the web server |
| `backend/server/app.js` | Booking logic, validation, admin API |
| `backend/server/auth.js` | Signup/login/logout and session handling |
| `backend/tests/api.test.js` | Tests the app behavior |
| `frontend/src/api.js` | Simple helper for calling the API |

---

## 11) Before you get lost in code

A few beginner-friendly rules:

- `app.get(...)` means "respond to a read request"
- `app.post(...)` means "respond to a create request"
- `req` means the incoming request
- `res` means the response being sent back
- `db.collection(...)` means "get a table-like collection in MongoDB"
- `await` means "wait for this database/server operation to finish before continuing"

That is enough to understand a lot of backend code without needing to know every detail.

---

## 12) Final takeaway

This project is a small full-stack application that manages cleaning bookings:

- the browser-side helper sends requests
- the backend validates and stores data
- the database keeps track of users and bookings
- tests make sure the app behaves correctly

If you want, the next step could be a second guide that explains the app one route at a time, like:

- what does `/api/auth/signup` do?
- what does `/api/bookings` do?
- what does `/api/admin/bookings/:id` do?

That would make the code much easier to follow step by step.
