# M3tering Arweave Gateway Interface

This project is a GraphQL interface for interacting with M3tering Protocol meter data. It integrates with Arweave and MongoDB to manage and query meter data efficiently.

## Prerequisites

Before setting up the project, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or later)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [MongoDB](https://www.mongodb.com/) (running instance)
- An Arweave Gateway URL

## Setup Instructions

1. **Clone the Repository**:

   ```bash
   git clone <repository-url>
   cd m3tering-arweave-gateway-interface
   ```

2. **Install Dependencies**:
   Install the required dependencies using npm:

   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory by copying the provided `.env.example` file:

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your Arweave Gateway URL and MongoDB URI and other variables.

4. **Compile the TypeScript Code**:
   Compile the TypeScript code into JavaScript:

   ```bash
   npm run compile
   ```

5. **Run the Application**:
   Start the application:

   ```bash
   npm start
   ```

   Alternatively, for development with hot-reloading:

   ```bash
   npm run dev
   ```

6. **Access the GraphQL Interface**:
   Once the application is running, you can access the GraphQL interface at:

   ```browser
   http://localhost:5000/graphql
   ```

## Key Environment Variables

- `ARWEAVE_GATEWAY_URL`: The URL of the Arweave gateway to interact with.
- `MONGODB_URI`: The connection string for your MongoDB instance.
- `GNOSIS_MAINNET_RPC`
- `ETH_MAINNET_RPC`
- `PORT`

## License

This project is licensed under the ISC License.
