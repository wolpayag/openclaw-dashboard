# OpenClaw Dashboard

Self-hosted AI workflow monitoring dashboard for OpenClaw with real-time task tracking, agent activity, and resource usage analytics.

![Dashboard Preview](docs/assets/dashboard-preview.png)

## Features

### Task Overview
- Real-time task status tracking (pending, in progress, completed, failed)
- Task queue with progress indicators
- Task history with searchable timestamps
- Advanced filtering by status, date, and agent

### Agent Activity
- Live agent status monitoring (active, idle, error)
- Workload distribution visualization
- Performance metrics and statistics
- Agent assignment tracking

### Resource Usage (Kimi Console)
- Real-time API volume consumption
- Usage alerts at 80%, 90%, 95% thresholds
- Daily/weekly/monthly statistics
- Cost estimation and budgeting

### Model Monitoring
- Per-task model usage tracking
- Reasoning mode status monitoring
- Token usage analytics
- Model performance comparison

### System Health
- Overall health indicators
- Error rate monitoring
- API response time tracking
- Real-time failure alerts

## Tech Stack

- **Frontend**: React 18 + Vite + Recharts
- **Backend**: Node.js + Express + Socket.io
- **Database**: SQLite (default) / PostgreSQL (production)
- **Real-time**: WebSocket via Socket.io
- **Styling**: TailwindCSS + Dark/Light themes
- **Containerization**: Docker + Docker Compose

## Quick Start

### Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/wolpayag/openclaw-dashboard.git
cd openclaw-dashboard

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start the application
docker-compose up -d

# Access the dashboard
open http://localhost:3000
```

### Manual Installation

#### Prerequisites
- Node.js 18+
- npm or yarn
- SQLite (or PostgreSQL for production)

#### Backend Setup

```bash
cd api
npm install

# Copy environment template
cp .env.example .env

# Configure your environment variables
nano .env

# Start the server
npm run dev
```

#### Frontend Setup

```bash
cd web
npm install

# Copy environment template
cp .env.example .env

# Start the development server
npm run dev
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | `3001` |
| `DB_TYPE` | Database type (sqlite/postgres) | `sqlite` |
| `DB_PATH` | SQLite database path | `./data/dashboard.db` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `OPENCLAW_API_URL` | OpenClaw API endpoint | `http://localhost:8080` |
| `KIMI_API_KEY` | Kimi Console API key | - |
| `JWT_SECRET` | Secret for JWT tokens | - |
| `LOG_LEVEL` | Logging level | `info` |

See `.env.example` for complete configuration options.

## OpenClaw Integration

To enable full monitoring capabilities, configure OpenClaw to send events to the dashboard:

1. Add webhook configuration to OpenClaw:

```yaml
# openclaw-config.yaml
webhooks:
  - url: http://localhost:3001/api/webhooks/openclaw
    events:
      - task.created
      - task.started
      - task.completed
      - task.failed
      - agent.status_changed
```

2. Restart OpenClaw to apply changes.

## API Documentation

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List all tasks |
| GET | `/api/tasks/:id` | Get task details |
| GET | `/api/agents` | List all agents |
| GET | `/api/agents/:id` | Get agent details |
| GET | `/api/stats/usage` | Get usage statistics |
| GET | `/api/stats/performance` | Get performance metrics |
| POST | `/api/webhooks/openclaw` | OpenClaw event webhook |

See [API Documentation](docs/API.md) for complete reference.

## Development

### Project Structure

```
openclaw-dashboard/
├── api/                    # Backend API
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── models/        # Database models
│   │   └── websocket/     # WebSocket handlers
│   └── tests/
├── web/                    # Frontend React app
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   └── store/         # State management
│   └── tests/
├── config/                 # Configuration files
├── docs/                   # Documentation
└── docker-compose.yml      # Docker orchestration
```

### Running Tests

```bash
# Backend tests
cd api && npm test

# Frontend tests
cd web && npm test
```

### Building for Production

```bash
# Build frontend
cd web && npm run build

# Start production API
cd api && npm run start
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feat/amazing-feature`
5. Open a Pull Request

See [Contributing Guidelines](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- Documentation: [docs/](docs/)
- Issues: [GitHub Issues](https://github.com/wolpayag/openclaw-dashboard/issues)
- Discussions: [GitHub Discussions](https://github.com/wolpayag/openclaw-dashboard/discussions)
