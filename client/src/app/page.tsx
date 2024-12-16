"use client"

import { ethers } from "ethers";
import detectEthereumProvider from "@metamask/detect-provider";
import { ABI } from "@/lib/ABI";

export default function HomePage() {

  const handleConnect = async () => {
    const provider: any = await detectEthereumProvider();
  
    if (provider) {
      const ethersProvider = new ethers.BrowserProvider(provider);
        const signer = await ethersProvider.getSigner();
        const contractInstance = new ethers.Contract("0x6f1f65F25De13587F158a442b2BAe3F3e39A755E", ABI, signer);
        const currentAccount = await signer.getAddress();

        console.log({
          contractInstance,
          currentAccount
        })
    }
  }
  
  return (
    <main>
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md text-center mx-auto">
          <button
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg mb-4 w-full"
              onClick={handleConnect}
          >
              Connect to MetaMask
          </button>
          <p className="text-gray-600">
              Please install MetaMask if you haven't already.
          </p>
      </div>
    </main>
  )
}
