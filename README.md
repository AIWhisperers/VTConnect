# The Blockchain Hotel Voice Assistant

## Overview

This project demonstrates a real-time voice assistant API that captures user actions and transforms them into blockchain interactions. As a demo use case, we use an on-chain reservation system for "The Blockchain Hotel," where reservations are modeled as NFTs. The voice assistant queries the user for check-in and check-out dates, checks if the corresponding NFTs are not minted, and if available, initiates a mint transaction.

## Features

- Real-time voice assistant API integration
- On-chain reservation system using NFTs
- Voice-based interaction for booking hotel rooms
- Checks availability of rooms by querying the blockchain
- Mints NFTs for reservations if available

   
### Running the Project

## Usage

1. Start the local blockchain:
   ```sh
   yarn chain
   ```

2. Deploy the smart contracts to the desired network (replace `xxx` with the network name, e.g., [`baseSepolia`](command:_github.copilot.openSymbolFromReferences?%5B%22baseSepolia%22%2C%5B%7B%22uri%22%3A%7B%22%24mid%22%3A1%2C%22fsPath%22%3A%22%2FUsers%2Fmohamed.a%2Fpersonal%2Faiwhisperers%2Fvtt_scaffold%2Fpackages%2Fhardhat%2Fhardhat.config.ts%22%2C%22external%22%3A%22file%3A%2F%2F%2FUsers%2Fmohamed.a%2Fpersonal%2Faiwhisperers%2Fvtt_scaffold%2Fpackages%2Fhardhat%2Fhardhat.config.ts%22%2C%22path%22%3A%22%2FUsers%2Fmohamed.a%2Fpersonal%2Faiwhisperers%2Fvtt_scaffold%2Fpackages%2Fhardhat%2Fhardhat.config.ts%22%2C%22scheme%22%3A%22file%22%7D%2C%22pos%22%3A%7B%22line%22%3A105%2C%22character%22%3A4%7D%7D%5D%5D "Go to definition")):
   ```sh
   yarn deploy --network xxx
   ```

3. Start the front-end application:
   ```sh
   yarn start
   ```

4. Start the real-time voice activity detection (VAD) service:
   ```sh
   yarn relay
   ```

## Usage

1. The voice assistant will greet you and ask for your check-in and check-out dates.
2. Provide the dates, and the assistant will check the availability by querying the blockchain.
3. If the dates are available, the assistant will initiate a mint transaction to reserve the room as an NFT.

## License

This project is licensed under the MIT License - see the LICENSE file for details.


Happy coding! 🚀