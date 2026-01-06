# Contributing to Uptime Monitor

First off, thank you for considering contributing to Uptime Monitor! It's people like you that make this project better for everyone.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if relevant**
- **Include your environment details** (OS, Node version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any alternative solutions you've considered**

### Pull Requests

1. Fork the repository
2. Create a new branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Make your changes:
   - Write clear, concise commit messages
   - Follow the existing code style
   - Add tests if applicable
   - Update documentation as needed

4. Test your changes:
   ```bash
   npm run dev
   npm run lint
   ```

5. Commit your changes:
   ```bash
   git commit -m "feat: add amazing feature"
   ```

6. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

7. Open a Pull Request

## Development Setup

1. Clone your fork:
   ```bash
   git clone https://github.com/your-username/uptime-monitor.git
   cd uptime-monitor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start MongoDB (if running locally):
   ```bash
   mongod
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. In another terminal, run the monitoring service:
   ```bash
   npm run monitor
   ```

### Mobile App Development

For mobile app development:

1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```

2. Install Flutter dependencies:
   ```bash
   flutter pub get
   ```

3. Run on Android/iOS:
   ```bash
   flutter run
   ```

See [mobile/README.md](./mobile/README.md) for detailed mobile development setup.

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid using `any` type unless absolutely necessary

### Code Style

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Follow existing patterns in the codebase

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add TCP monitor support
fix: resolve email notification issue
docs: update installation guide
```

## Project Structure

```
uptime-monitor/            # Root = Server (Next.js)
├── app/                   # Next.js app directory
│   ├── api/              # API routes
│   ├── dashboard/        # Dashboard pages
│   └── status/           # Public status pages
├── components/           # React components
│   └── ui/              # UI components
├── lib/                  # Utility functions
│   ├── db.ts            # Database connection
│   ├── monitor.ts       # Monitoring logic
│   └── notifications.ts # Alert system
├── models/               # MongoDB models
├── scripts/              # Background scripts
├── types/                # TypeScript types
├── public/               # Static assets
│
├── mobile/               # Flutter Mobile App
│   ├── lib/             # Flutter source code
│   ├── android/         # Android platform files
│   └── ios/             # iOS platform files
│
└── relay/                # FCM Relay Service
    └── functions/       # Firebase Cloud Functions
```

## Testing

Currently, the project doesn't have automated tests. Adding tests is a great way to contribute!

If you add tests:
- Place unit tests next to the code they test
- Use descriptive test names
- Test edge cases

## Documentation

- Update the README.md if you change functionality
- Add JSDoc comments for public APIs
- Update CONTRIBUTING.md if you change the contribution process

## Questions?

Feel free to open an issue with the label `question` if you have any questions about contributing.

## Recognition

Contributors will be recognized in our README.md file. Thank you for your contributions!
