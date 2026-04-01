require('./config/env'); // validates env vars on startup
const app = require('./app');
const { port } = require('./config/env');

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`API Docs: http://localhost:${port}/api-docs`);
});
