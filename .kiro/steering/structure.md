# Project Structure

## Current Structure
```
affilist/
├── .git/           # Git repository metadata
├── .kiro/          # Kiro AI assistant configuration
│   └── steering/   # AI guidance documents
├── .gitignore      # Git ignore patterns (Node.js focused)
├── LICENSE         # MIT License
└── README.md       # Project documentation (minimal)
```

## Recommended Structure
As the project develops, consider organizing with:

```
affilist/
├── src/            # Source code
├── tests/          # Test files
├── docs/           # Documentation
├── config/         # Configuration files
├── public/         # Static assets (if web app)
├── scripts/        # Build/deployment scripts
└── package.json    # Node.js dependencies and scripts
```

## Conventions
- Use lowercase with hyphens for directory names
- Keep source code in `src/` directory
- Place tests alongside source files or in dedicated `tests/` directory
- Use clear, descriptive file and directory names
- Follow Node.js project conventions once package.json is added