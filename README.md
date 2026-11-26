# Sweep Dreams – Cleaning Service Booking System

**We clean. You relax.**

Sweep Dreams is a web-based cleaning service booking system developed using the MERN stack (MongoDB, Express.js, React, and Node.js). It provides customers with a convenient way to browse cleaning services, create accounts, submit booking requests, manage reservations, and leave feedback.

The system also includes an administrative interface for managing customer bookings, confirming reservations, assigning cleaners, and monitoring cleaning progress.

## Technologies Used

- **Frontend:** React.js, Vite, CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Development Tools:** npm, Git, GitHub
- **Demo environment:** Local computer at `http://127.0.0.1:5173`

## Getting Started

### Prerequisites

Before running the application, make sure you have installed:

- Node.js 20.19+ or 22.12+
- npm
- MongoDB (for persistent database storage)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/ngaza/SweepDreams.git
   ```

2. Navigate to the project directory:

   ```bash
   cd SweepDreams
   ```

3. Install the project dependencies:

   ```bash
   npm install
   ```

4. Build the frontend:

   ```bash
   npm run build
   ```

5. Start the application:

   ```bash
   npm run demo
   ```

6. Open your browser and visit:

   ```text
   http://127.0.0.1:5173
   ```

The application will now be running locally.

The server listens on `127.0.0.1`, so the demo is accessed from the same computer. These commands start the local application. `npm run build` creates frontend files on disk and does not publish them.

For Administrator Login, use `sweep-dreams-class-demo` unless you have set a custom `ADMIN_KEY` in `backend/.env`. Stop the demo with Ctrl+C. Demo accounts, bookings, and photos reset when the server stops. The first run may download the MongoDB binary used by the temporary database.

## Database Configuration

Sweep Dreams supports both temporary and persistent MongoDB storage.

### Temporary Database

To run the application using the demonstration environment:

```bash
npm install
npm run build
npm run demo
```

The application automatically starts a temporary local MongoDB instance using `mongodb-memory-server`.

**Note:** Booking records and demo accounts remain available after browser refreshes but reset when the server stops.

### Persistent MongoDB

To use persistent database storage:

1. Copy `backend/.env.example` to `backend/.env`.
2. Configure the following environment variables:

   ```env
   MONGO_URI=your_mongodb_connection_string
   ADMIN_KEY=your_secure_admin_key
   ```

3. Make sure your local MongoDB service is running.
4. Start the application:

   ```bash
   npm install
   npm run build
   npm run dev
   ```

With persistent MongoDB configured, customer accounts, bookings, and feedback remain stored even after the application restarts.

**Important:** Keep your `.env` file private and never upload database credentials or administrator keys to GitHub.

## System Features

### 1. Customer Account Management

- Customer registration using name, email, and password.
- Customer login and logout.
- Password hashing using Node.js scrypt.
- Secure session management using HttpOnly cookies.
- Seven-day customer sessions.
- Access to booking history associated with customer accounts.
- Guest booking access using private booking references and tokens.

### 2. Cleaning Service Browsing

- Customer-facing home page.
- Cleaning service information and descriptions.
- Service details and pricing.
- Responsive service cards and navigation.
- Search and category filtering.
- Service information for customers before booking.

### 3. Booking Management

- Three-step cleaning service booking process.
- Selection of available room sizes.
- Customer information and dorm room details.
- Date and time selection.
- Automatic price calculation and server-side validation.
- Booking reference generation.
- Private booking access tokens.
- Booking cancellation.

### 4. Administrative Dashboard

- Separate administrator login.
- Administrator key authentication.
- View customer booking requests.
- Confirm and assign cleaners.
- Update booking statuses.
- Monitor booking information.
- Complete the cleaning checklist before marking a booking as finished.

### 5. Booking Status and Tracking

Customers can check their booking information and monitor its current status.

Available booking statuses:

- Pending
- Confirmed
- Completed
- Cancelled

The system displays the assigned cleaner when a booking has been confirmed.

### 6. Customer Ratings and Reviews

- Five-star rating system.
- Optional customer comments.
- Feedback submission after booking completion.
- Prevention of duplicate feedback submissions.
- Administrator access to submitted feedback.

### 7. Responsive User Interface

- Mobile-friendly layout.
- Responsive desktop navigation.
- Service cards and booking forms.
- Interactive calendar.
- Booking status timeline.
- Customer review interface.
- Accessible form labels and keyboard focus styles.

## Booking and Pricing Information

The currently implemented cleaning service is Basic Dorm Cleaning.

| Room size | Price |
|---|---:|
| Small Room (15 m² or below) | ₱300 |
| Standard Room (16–25 m²) | ₱450 |

**Booking details:**

- Estimated cleaning duration: Approximately one hour.
- Available time slots: 9:00 AM, 11:00 AM, 1:00 PM, and 3:00 PM.
- Payment method: Cash after service.

The system calculates prices on the server to prevent customers from changing booking prices through the frontend.

Additional cleaning services and other pricing options may be incorporated in future updates.

## Application Walkthrough

The following steps demonstrate the main customer and administrator workflows:

1. Open Sweep Dreams and click **Get Started**.
2. Browse the available cleaning service and select Basic Dorm Cleaning.
3. Click **Book Now** and select the preferred room size.
4. Choose an available cleaning date and time.
5. Enter the customer's name, email, and dorm room address.
6. Review the booking details and submit the request.
7. Save the generated booking reference and private access token.
8. Open the Administrator Login and enter the administrator key.
9. Find the booking request, assign a cleaner, and confirm the reservation.
10. Return to the customer booking page to check the updated status.
11. Complete the required cleaning checklist through the administrator dashboard.
12. Mark the booking as completed.
13. Submit a star rating and optional comment through the customer review section.

## System Architecture

Sweep Dreams follows a MERN-based architecture.

```text
          CUSTOMER / ADMIN
                 |
                 v
          REACT FRONTEND
                 |
                 v
          EXPRESS REST API
                 |
                 v
             MONGODB
                 |
                 v
          BOOKING RECORDS
```

### Frontend

The React frontend handles the customer interface, account registration, login, service browsing, booking forms, booking status, and administrative screens.

### Backend

The Express.js backend handles authentication, booking requests, validation, administrator access, booking updates, and customer feedback.

### Database

MongoDB stores customer accounts, sessions, booking information, assigned cleaners, cleaning checklists, and customer feedback.

## API Endpoints

The application uses the following API routes:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/config` | Retrieves application configuration |
| POST | `/api/bookings` | Creates a booking request |
| GET | `/api/bookings/:id` | Retrieves a booking |
| POST | `/api/bookings/:id/cancel` | Cancels a booking |
| POST | `/api/bookings/:id/feedback` | Submits customer feedback |
| GET | `/api/admin/bookings` | Retrieves administrator booking records |
| PATCH | `/api/admin/bookings/:id` | Updates booking information and status |

## Security and Validation

The application includes several security and validation measures:

- Passwords are salted and hashed using Node.js scrypt.
- Customer sessions use HttpOnly and SameSite cookies.
- Administrator access requires a separate administrator key.
- Private booking tokens protect guest booking information.
- Customer passwords and private booking tokens are not exposed in administrator booking lists.
- Booking dates, room sizes, and prices are validated on the server.
- Conflicting confirmed bookings for the same date and time are prevented through a MongoDB unique partial index.
- Booking feedback is restricted to completed bookings.
- Customer accounts are isolated from other customer accounts.

## Testing and Validation

To run the automated integration tests:

```bash
npm test
```

The integration tests cover:

- Booking creation and retrieval.
- Price manipulation prevention.
- Invalid booking dates and room sizes.
- Private booking access.
- Unauthorized administrator access.
- Conflicting booking schedules.
- Booking status transitions.
- Required cleaning checklist.
- Booking cancellation.
- Customer feedback validation.
- Duplicate feedback prevention.
- MongoDB data storage.
- Customer registration and authentication.
- Incorrect passwords and duplicate email addresses.
- Session logout and account isolation.

The frontend production build can also be checked using:

```bash
npm run build
```

## Current System Limitations and Future Improvements

Although the main application workflows are functional, the following features are not yet implemented:

- Email verification and password recovery.
- Facebook, Google, and Apple authentication.
- Online GCash and credit/debit card payments.
- Automatic booking notifications.
- In-app customer and cleaner messaging.
- Live cleaner location tracking and arrival estimates.
- Online payment processing.
- Multiple cleaning service categories with fully functional booking.
- Additional cleaning services such as deep cleaning, laundry, and appliance cleaning.
- Automatic cleaner screening and verification.
- Multiple service locations.

These features may be considered for future development and system improvements.

For actual service operations, the team must also establish cleaner screening procedures, confirm service rates, obtain necessary dormitory permissions, and implement appropriate customer privacy and data-retention policies.

## Project Repository

GitHub: https://github.com/ngaza/SweepDreams

## Project Team

**Sweep Dreams Development Team**

Developed collaboratively as a web application project using the MERN stack.

**Sweep Dreams – We clean. You relax.**
## Customer and cleaner accounts

Signup and login use Customer and Worker selection buttons. Public signup creates customer accounts only; worker accounts are created by the administrator under Create worker account using a name, email and password. Worker passwords are hashed and account creation does not sign the administrator in as the worker. The role is checked on login; choosing another role at login does not change an account. Existing accounts without a role remain customers. Each email belongs to one account.

Customers request and track cleans as before. Cleaners land on `#cleaner`, where they can search available future requests by address text, inspect the address, service, price and schedule, and choose **Accept booking**. The first successful acceptance confirms the request and assigns the signed-in cleaner. Customer names, contact details and instructions are shown to the assigned cleaner after acceptance. Customers can refresh their booking to see the assigned cleaner. Cleaners can complete only their own confirmed jobs after checking every cleaning checklist item. Customers can then leave feedback.

Location filtering uses the supplied address text; it does not calculate GPS distance or automatically assign the nearest cleaner. The existing pilot limit of one confirmed/completed booking per date/time slot remains. The administrator booking desk remains available.

To demonstrate, create a customer account and request a future clean. In another browser profile or private window, log in as Worker using credentials created in the administrator booking desk, open Cleaning jobs, search for the address, and accept the request. Refresh the customer's booking to see the cleaner. Complete the checklist as the cleaner, mark the visit complete, then refresh as the customer and submit feedback. Demo data resets when the demo server stops.

The integration test also covers invalid roles, role mismatch at login, customer-only booking creation, cleaner-only job access, private request previews, concurrent acceptance, and completion by the assigned cleaner.


## Worker progress and proof photos

The administrator monitors bookings and can cancel pending or confirmed requests. Manual assignment and administrator completion are disabled; workers accept requests using their accounts. Each checklist change is saved immediately for the assigned worker. The administrator booking list polls every two seconds while open and displays read-only checklist progress and the uploaded proof photo.

Workers upload one JPEG or PNG proof photo (up to 1 MB) per booking. The photo is saved with the booking in MongoDB and may be replaced while the booking is confirmed. Completing a booking requires all saved checklist items and a saved proof photo. Only the assigned worker may update progress, upload proof, or complete the visit. Photos are returned only through authenticated booking views; include only the cleaned area in proof photos.

Proof photos are now linked to individual checklist tasks. Every task needs its own uploaded photo before completion. Admins see each photo below its corresponding task. JPEG/PNG originals up to 15 MB are accepted in the browser; originals above 1 MB are resized locally (starting at a 1920-pixel longest edge) and compressed to at most 1 MB per uploaded photo. Small originals are retained unchanged. Existing booking-level proof photos remain visible as previous proof but do not satisfy the per-task requirement for unfinished bookings.
