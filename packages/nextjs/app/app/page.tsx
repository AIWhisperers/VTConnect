"use client";
import type { NextPage } from "next";
// import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";
import { ConsolePage } from "./_components/ConsolePage";
import './App.scss';
// export const metadata = getMetadata({
//   title: "Debug Contracts",
//   description: "Debug your deployed 🏗 Scaffold-ETH 2 contracts in an easy way",
// });


const App: NextPage = () => {
  // const { data: yourContract } = useScaffoldContract({
  //   contractName: "YourContract",
  // });
  // const {data, isLoading} = useScaffoldReadContract({
  //   contractName: "YourContract",
  //   functionName: "available",
  //   args: [1n],
  // });
  // const useEffect = () => {
  //   console.log("useEffect");
  // ,[]}

  return (
    <div data-component="App">
      <ConsolePage />
    </div>
  );
};

export default App;
