import express from 'express';
import cors from 'cors';
import routes from './routes';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from "express-session";
import passport from "passport";
import "./middleware/passport.middleware";
import http from "http";
import { initSocket } from "./socket";

const app = express();
app.use(helmet());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://ride-booking-nexus.vercel.app",


    ],

    credentials: true,
  })
);

app.use(express.json({ limit: '30kb' }));
app.use(express.urlencoded({ extended: true }));




app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-origin in production
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);


app.use(passport.initialize());
app.use(passport.session());

const server = http.createServer(app);
initSocket(server);

app.use('/api', routes);
app.get('/', (req, res) => {

  res.send("Welcome to Ride Booking Server")



})


export { app, server };   
