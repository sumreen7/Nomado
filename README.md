# Nomado - AI-Powered Travel Planning Assistant

Nomado is an intelligent travel planning application that helps users create personalized travel itineraries using AI agents. The application provides real-time flight information, accommodation suggestions, and visa requirements for your travel plans.

## Features

- 🤖 AI-powered travel planning with specialized agents
- ✈️ Real-time flight search and booking information
- 🏨 Smart accommodation recommendations
- 📝 Visa requirement checking and documentation
- 💰 Currency conversion and cost estimation
- 📱 Responsive design for both desktop and mobile

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Headless UI
- **State Management**: Zustand
- **API Integration**: Amadeus API for flight data
- **UI Components**: Geist UI, Heroicons
- **Data Fetching**: React Query

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Amadeus API credentials (for flight data)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/nomado.git
   cd nomado
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory:
   ```
   AMADEUS_CLIENT_ID=your_client_id_here
   AMADEUS_CLIENT_SECRET=your_client_secret_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3003](http://localhost:3003) in your browser

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Mobile App Development

The application is built with a mobile-first approach using responsive design. To convert it into a native mobile app, you have several options:

1. **Progressive Web App (PWA)**
   - Add PWA support to the existing Next.js app
   - Users can install it on their home screen
   - Works offline with service workers

2. **React Native**
   - Convert the app to React Native
   - Maintain the same business logic
   - Create native mobile UI components

3. **Native Wrapper**
   - Use Capacitor or Cordova to wrap the web app
   - Access native device features
   - Distribute through app stores

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Amadeus API for flight data
- Next.js team for the amazing framework
- All contributors and users of Nomado
