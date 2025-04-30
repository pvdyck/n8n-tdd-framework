// Load environment variables from .env.test
require('dotenv').config({ path: '.env.test' });

// Run the tests
const { spawnSync } = require('child_process');
const result = spawnSync('npm', ['test'], { 
  stdio: 'inherit',
  env: { ...process.env }
});

process.exit(result.status);
