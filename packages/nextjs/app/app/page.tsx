"use client";
import type { NextPage } from "next";
import { ConsolePage } from "./_components/ConsolePage";
import './App.scss';
import { ContractProvider, useContract } from "./contractContext";
import { Address } from "~~/components/scaffold-eth";

const ConsoleComponent = () => {
  const { isLoading, address } = useContract();
  return (
    <div className="console">
      {isLoading ? <div>Loading...</div> :
        <>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            Contract Address: <Address address={address} format="long"/>
          </div>
          <ConsolePage />
        </>
      }
    </div>
  );
}

const App: NextPage = () => {
  return (
    <ContractProvider>
      <ConsoleComponent />
    </ContractProvider>
  );
};

export default App;
