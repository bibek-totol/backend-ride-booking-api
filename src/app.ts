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
app.use(cors());
app.use(express.json({ limit: '30kb' }));
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);   
initSocket(server);                     

app.use('/api', routes);

export { app, server };   
