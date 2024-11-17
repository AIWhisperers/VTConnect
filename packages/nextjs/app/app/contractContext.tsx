import React, { createContext, useContext, ReactNode } from 'react';
import { useWalletClient } from 'wagmi';
import { useScaffoldContract } from '~~/hooks/scaffold-eth';


// Define the shape of the context
interface ContractContextType {
  isLoading: boolean;
  address: string | undefined;
  available: (id: bigint) => Promise<any>;
  mint: (id: bigint) => Promise<any>;
}

// Create the context with a default value
const ContractContext = createContext<ContractContextType | undefined>(undefined);

// Create a provider component
const ContractProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data: walletClient } = useWalletClient();
  const { data: yourContract, isLoading } = useScaffoldContract({
    contractName: "YourContract",
    walletClient,
  });

  const available = async (id: bigint) => {
    if (!yourContract) return;
    return await yourContract.read.available([id]);
  }
  const mint = async (id: bigint) => {
    if (!yourContract) return;
    if (!walletClient?.account.address) return;
    return await yourContract.write.safeMint([walletClient?.account.address, id]);
  }

  return (
    <ContractContext.Provider value={{ isLoading, available, mint, address: yourContract?.address }}>
      {children}
    </ContractContext.Provider>
  );
};

// Create a custom hook to use the context
const useContract = () => {
  const context = useContext(ContractContext);
  if (context === undefined) {
    throw new Error('useContract must be used within a ContractProvider');
  }
  return context;
};

export { ContractProvider, useContract };