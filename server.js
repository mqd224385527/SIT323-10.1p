const express = require('express');
const { MongoClient } = require('mongodb');
const winston = require('winston');
const promClient = require('prom-client');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskdb';

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

register.registerMetric(httpRequestDurationMicroseconds);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'task-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
      )
    })
  ]
});

app.use(express.json());

app.use((req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.route ? req.route.path : req.path, status_code: res.statusCode });
  });
  next();
});

app.get('/', (req, res) => {
  logger.info('Root endpoint accessed');
  res.send('Welcome to Cloud Native App!');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

let db;

async function connectToMongoDB() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db();
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error(`Failed to connect to MongoDB: ${error.message}`);
    process.exit(1);
  }
}

app.get('/tasks', async (req, res) => {
  try {
    const tasks = await db.collection('tasks').find({}).toArray();
    logger.info('Tasks retrieved successfully');
    res.json(tasks);
  } catch (error) {
    logger.error(`Error retrieving tasks: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve tasks' });
  }
});

app.post('/tasks', async (req, res) => {
  try {
    const task = { ...req.body, createdAt: new Date() };
    const result = await db.collection('tasks').insertOne(task);
    logger.info(`Task created with ID: ${result.insertedId}`);
    res.status(201).json({ id: result.insertedId, ...task });
  } catch (error) {
    logger.error(`Error creating task: ${error.message}`);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

app.listen(PORT, async () => {
  await connectToMongoDB();
  logger.info(`Server running on port ${PORT}`);
}); 