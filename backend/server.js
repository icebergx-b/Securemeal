const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

dotenv.config({ quiet: true });

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'SecureMeal backend is running.' });
});

app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
