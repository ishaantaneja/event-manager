# Event Management System

A comprehensive event management website with user authentication, event booking, and administrative controls built with React.js, Node.js, Express, and MongoDB.

## 🚀 Features

### User Features
- **User Authentication**: Secure registration and login with JWT
- **Event Browsing**: Browse all events with advanced search and filtering
- **Event Booking**: Book events and manage bookings
- **User Dashboard**: View and manage bookings, preferences, and bookmarks
- **Personalized Recommendations**: Get event suggestions based on preferences
- **Social Sharing**: Share events on social media platforms
- **Comments**: Add comments to events

### Admin Features
- **Analytics Dashboard**: View statistics on users, events, and bookings
- **Event Management**: Create, update, and delete events
- **User Management**: View and manage user roles
- **Booking Management**: View all bookings across the platform

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB Atlas account (free tier works)

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd event-manager
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 4. Environment Variables

Backend `.env` file is already configured with:
- MongoDB Atlas connection string
- JWT secret
- Server port

Frontend will use the default API URL (http://localhost:5000/api)

## 🚀 Running the Application

### Start Backend Server
```bash
cd backend
npm run dev
```
The server will start on http://localhost:5000

### Start Frontend Application
```bash
cd frontend
npm start
```
The application will open on http://localhost:3000

## 📱 Application Structure

```
event-manager/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth and error middleware
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Utility functions
│   │   ├── app.js          # Express app setup
│   │   └── server.js       # Server entry point
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/      # Reusable components
    │   ├── pages/          # Page components
    │   ├── services/       # API service
    │   ├── store/          # Redux store and slices
    │   ├── App.js          # Main App component
    │   └── index.js        # React entry point
    └── package.json
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Events
- `GET /api/events` - Get all events with filters
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create event (admin)
- `PUT /api/events/:id` - Update event (admin)
- `DELETE /api/events/:id` - Delete event (admin)
- `POST /api/events/:id/comments` - Add comment
- `GET /api/events/recommendations` - Get personalized recommendations

### Bookings
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id/cancel` - Cancel booking
- `GET /api/bookings/all` - Get all bookings (admin)

### Admin
- `GET /api/admin/analytics` - Get analytics data
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/role` - Update user role

### Users
- `PUT /api/users/preferences` - Update preferences
- `POST /api/users/bookmarks/:eventId` - Add bookmark
- `DELETE /api/users/bookmarks/:eventId` - Remove bookmark
- `GET /api/users/bookmarks` - Get bookmarked events

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📦 Deployment

### Backend (Heroku/Render)
1. Create a new app on Heroku/Render
2. Set environment variables
3. Deploy using Git or GitHub integration

### Frontend (Netlify/Vercel)
1. Build the production version:
   ```bash
   npm run build
   ```
2. Deploy the `build` folder to Netlify/Vercel

## 🎯 Usage

### For Users:
1. Register or login to your account
2. Browse available events
3. Use filters to find events by category, location, or search term
4. Click on an event to view details
5. Book events you're interested in
6. View your bookings in the dashboard
7. Set preferences for personalized recommendations

### For Admins:
1. Login with an admin account
2. Access the admin dashboard
3. Create new events
4. View analytics and manage users
5. Monitor all bookings

## 🔐 Default Admin Account

To create an admin account:
1. Register a normal account
2. Use MongoDB Atlas or a database tool to update the user's role to "admin"
3. Or use the admin panel to promote users

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure your MongoDB Atlas cluster is running
- Check if your IP address is whitelisted in MongoDB Atlas
- Verify the connection string in `.env`

### Port Already in Use
- Backend: Change PORT in `.env`
- Frontend: The React app will prompt for a different port

### CORS Issues
- Ensure the CLIENT_URL in backend `.env` matches your frontend URL

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Support

For support, email your-email@example.com or open an issue in the repository.

## 🎉 Acknowledgments

- Built with React.js, Node.js, Express, and MongoDB
- Styled with Tailwind CSS
- State management with Redux Toolkit
- Authentication with JWT
