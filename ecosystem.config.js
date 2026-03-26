module.exports = {
  apps: [
    {
      name: 'weightwaise-backend',
      cwd: './backend',
      script: '.venv/bin/uvicorn',
      args: 'app.main:app --host 0.0.0.0 --port 8003',
      interpreter: 'none',
      env: {
        PATH: `${__dirname}/backend/.venv/bin:${process.env.PATH}`,
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
    },
    {
      name: 'weightwaise-frontend',
      cwd: './frontend',
      script: 'node_modules/.bin/next',
      args: 'dev -p 3002',
      interpreter: 'none',
      watch: false,
      autorestart: true,
      max_restarts: 10,
    },
  ],
};
