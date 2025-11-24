import express from 'express';
import cors from 'cors';
import routes from './routes';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from "express-session";
import passport from "passport";
import "./middleware/passport.middleware";



const app = express();
app.use(helmet()); 
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(express.json({ limit: '30kb' }));
app.use(express.urlencoded({ extended: true }));




const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, 
  max: 40, 
  message: 'Too many requests from this IP, please try again later.'
});


app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, 
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use('/api', limiter);
app.use('/api', routes);








app.use((err:any, _req:any, res:any, _next:any) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});


export default app;