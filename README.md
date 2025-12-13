# Strade - Decentralized Marketplace on Stacks

[![Stacks](https://img.shields.io/badge/Stacks-Blockchain-5546FF?style=flat&logo=stacks)](https://www.stacks.co/)
[![Clarity](https://img.shields.io/badge/Clarity-4.0-blue?style=flat)](https://clarity-lang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Testnet](https://img.shields.io/badge/Testnet-Live-success)](https://explorer.hiro.so/address/STGEE2D7NV4RJC1MHK59AN83PEN0CBBEXNG4QQVF?chain=testnet)

A secure, decentralized marketplace built on the Stacks blockchain, featuring smart contract-powered escrow, dispute resolution, and user reputation systems.

## 🌟 Features

### Core Marketplace
- **Create Listings**: List items for sale with customizable pricing and duration
- **Browse & Search**: Discover active listings with real-time updates
- **Direct Purchases**: Secure STX-based transactions with immediate confirmation
- **Listing Management**: Update, cancel, or modify your listings anytime

### Escrow Service
- **Trustless Transactions**: Automated escrow holds funds until conditions are met
- **7-Day Protection**: Standard escrow duration with automatic expiry handling
- **Flexible Release**: Buyer-initiated or dispute-based fund releases
- **Refund Mechanism**: Built-in refund system for failed transactions

### Dispute Resolution
- **Fair Arbitration**: Community-based voting system for dispute resolution
- **24-Hour Voting Period**: Efficient dispute resolution process
- **Multi-Arbitrator Support**: Minimum 3 votes required for decisions
- **Transparent Process**: All dispute actions recorded on-chain

### User Profiles & Reputation
- **User Registration**: Create profiles with username, bio, and email
- **Rating System**: 5-star rating system for buyers and sellers
- **Reputation Score**: Calculated scores based on ratings and activity
- **Authorization System**: Contract-based user permissions

### BST Token (Strade Token)
- **SIP-010 Compliant**: Standard fungible token implementation
- **1 Trillion Supply**: Initial supply minted to deployer
- **6 Decimals**: Precision for micro-transactions
- **Pausable Contract**: Emergency pause functionality for security

## 🏗️ Architecture

### Smart Contracts (Clarity 4)

```
contracts/
├── CoreMarketPlace.clar      # Main marketplace logic
├── EscrowService.clar         # Escrow management
├── DisputeResolution_clar.clar # Arbitration system
├── UserProfile.clar           # User management
└── token.clar                 # BST token (SIP-010)
```

### Frontend (Next.js 15)

```
frontend/
├── src/
│   ├── app/                   # Next.js app router pages
│   ├── components/            # React components
│   ├── lib/                   # Stacks integration & utilities
│   └── test/                  # Unit tests
└── public/                    # Static assets
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- [Clarinet](https://github.com/hirosystems/clarinet) for smart contract development
- [Leather Wallet](https://leather.io/) for testnet interactions

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/strade.git
   cd strade
   ```

2. **Install dependencies**
   ```bash
   # Install Clarinet (if not already installed)
   curl -L https://github.com/hirosystems/clarinet/releases/download/latest/clarinet-linux-x64.tar.gz | tar xz
   
   # Install frontend dependencies
   cd frontend
   npm install
   ```

3. **Configure environment**
   ```bash
   # Frontend configuration is in src/lib/stacks.ts
   # Contract addresses are already configured for testnet
   ```

### Running Locally

#### Smart Contracts

```bash
# Check contract syntax
clarinet check

# Run contract tests
clarinet test

# Start local console
clarinet console
```

#### Frontend

```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test
```

Visit `http://localhost:3000` to see the application.

## 📋 Testnet Deployment

All contracts are deployed and verified on Stacks Testnet:

| Contract | Address |
|----------|---------|
| CoreMarketPlace | `STGEE2D7NV4RJC1MHK59AN83PEN0CBBEXNG4QQVF.CoreMarketPlace` |
| EscrowService | `STGEE2D7NV4RJC1MHK59AN83PEN0CBBEXNG4QQVF.EscrowService` |
| UserProfile | `STGEE2D7NV4RJC1MHK59AN83PEN0CBBEXNG4QQVF.UserProfile` |
| DisputeResolution | `STGEE2D7NV4RJC1MHK59AN83PEN0CBBEXNG4QQVF.DisputeResolution_clar` |
| BST Token | `STGEE2D7NV4RJC1MHK59AN83PEN0CBBEXNG4QQVF.token` |

**Deployer Address**: [STGEE2D7NV4RJC1MHK59AN83PEN0CBBEXNG4QQVF](https://explorer.hiro.so/address/STGEE2D7NV4RJC1MHK59AN83PEN0CBBEXNG4QQVF?chain=testnet)

See [DEPLOYMENT_RESULTS.md](DEPLOYMENT_RESULTS.md) for detailed deployment information.

## 🧪 Testing

### Smart Contract Tests

```bash
# Run all contract tests
npm test

# Run with coverage
clarinet test --coverage

# Run specific test file
npm test -- tests/CoreMarketPlace.test.ts
```

### Frontend Tests

```bash
cd frontend

# Run unit tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

### Test Coverage

- ✅ CoreMarketPlace: 20 tests
- ✅ Fuzz Testing: 13 tests
- ✅ All contracts verified on testnet

## 🔐 Security Features

- **Input Validation**: All user inputs are validated on-chain
- **Access Control**: Function-level permissions and ownership checks
- **Escrow Protection**: Automatic fund locking and secure release mechanisms
- **Dispute Resolution**: Multi-party arbitration prevents unilateral decisions
- **Emergency Pause**: Contract owner can pause operations if needed
- **Expiration Handling**: Automatic expiry for listings and escrow

## 📖 Documentation

### For Users
- [User Guide](docs/USER_GUIDE.md) - How to use Strade marketplace
- [FAQ](docs/FAQ.md) - Frequently asked questions

### For Developers
- [Smart Contract API](docs/CONTRACT_API.md) - Contract functions and parameters
- [Frontend Integration](docs/INTEGRATION.md) - How to integrate with Strade
- [Development Guide](docs/DEVELOPMENT.md) - Contributing guidelines

## 🛣️ Roadmap

### Phase 1: Core Functionality ✅
- [x] Smart contract development
- [x] Basic marketplace features
- [x] Escrow system
- [x] User profiles
- [x] Testnet deployment

### Phase 2: Enhanced Features 🚧
- [ ] Advanced search and filters
- [ ] Image upload and IPFS integration
- [ ] Mobile-responsive design improvements
- [ ] Real-time notifications
- [ ] Multi-currency support

### Phase 3: Scaling & Security 📋
- [ ] Professional security audit
- [ ] Mainnet deployment
- [ ] Performance optimization
- [ ] Analytics dashboard
- [ ] Community governance

### Phase 4: Ecosystem Growth 🎯
- [ ] Mobile app (iOS/Android)
- [ ] API for third-party integration
- [ ] Multi-chain support
- [ ] NFT marketplace integration
- [ ] Advanced reputation algorithms

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:
- All tests pass (`npm test`)
- Code follows existing style guidelines
- Commit messages are clear and descriptive
- Documentation is updated if needed

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📝 Smart Contract Details

### CoreMarketPlace
- **Purpose**: Main marketplace logic for listing management
- **Key Functions**: `create-listing`, `update-listing`, `cancel-listing`, `purchase-listing`
- **Features**: Time-based expiration, status tracking, event logging

### EscrowService
- **Purpose**: Secure fund holding during transactions
- **Key Functions**: `create-escrow`, `release-funds`, `refund-buyer`
- **Duration**: 1,008 blocks (~7 days)

### DisputeResolution
- **Purpose**: Fair dispute resolution through arbitration
- **Key Functions**: `raise-dispute`, `vote-on-dispute`, `resolve-dispute`
- **Voting Period**: 144 blocks (~24 hours)

### UserProfile
- **Purpose**: User identity and reputation management
- **Key Functions**: `register-user`, `update-profile`, `rate-user`, `calculate-reputation`
- **Features**: 5-star rating system, reputation scores

### BST Token
- **Standard**: SIP-010 Fungible Token
- **Functions**: `transfer`, `mint`, `burn`, `get-balance`
- **Supply**: 1,000,000,000,000 BST (1 trillion)

## 🔧 Technology Stack

### Blockchain
- **Stacks Blockchain**: Layer-1 blockchain for Bitcoin
- **Clarity 4**: Smart contract language with predictable behavior
- **PoX Consensus**: Proof of Transfer for Bitcoin finality

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Beautiful component library
- **Stacks.js**: Official Stacks JavaScript libraries

### Development Tools
- **Clarinet**: Local development and testing environment
- **Vitest**: Fast unit testing framework
- **ESLint**: Code linting and quality
- **Prettier**: Code formatting

## 📊 Project Statistics

- **Smart Contracts**: 5 deployed contracts
- **Total Lines of Code**: ~1,500 Clarity + ~2,000 TypeScript
- **Test Coverage**: 33 tests passing
- **Deployment Cost**: 0.427 STX
- **Clarity Version**: 4.0 (Epoch 3.0)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Stacks Foundation** - For the amazing blockchain infrastructure
- **Hiro Systems** - For development tools and APIs
- **Clarity Language** - For secure smart contract development
- **Open Source Community** - For inspiration and support

## 📞 Support & Community

- **Website**: [strade.io](https://strade.io) (Coming Soon)
- **Documentation**: [docs.strade.io](https://docs.strade.io) (Coming Soon)
- **Discord**: [Join our community](https://discord.gg/strade) (Coming Soon)
- **Twitter**: [@StradeMarket](https://twitter.com/StradeMarket) (Coming Soon)
- **Email**: support@strade.io

## ⚠️ Disclaimer

**TESTNET ONLY**: This project is currently deployed on Stacks Testnet. DO NOT use real assets or consider any transactions as having real-world value. The testnet can be reset at any time, and all data may be lost.

Before mainnet deployment, a comprehensive security audit will be conducted. Use at your own risk.

## 🌟 Star History

If you find this project useful, please consider giving it a star ⭐

---

**Built with ❤️ on Stacks Blockchain**

*Empowering decentralized commerce, one transaction at a time.*
