import express from 'express';
import cors from 'cors';
import routes from './routes';


const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api', routes);


// health
app.get('/health', (_req, res) => res.json({ status: 'ok' }));


app.use((err: any, _req: any, res: any, _next: any) => {
console.error(err);
res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});


export default app;