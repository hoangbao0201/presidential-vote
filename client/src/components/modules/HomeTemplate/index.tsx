"use client";

import Image from "next/image";
import { signIn, signOut, useSession } from "next-auth/react";

import { ethers } from "ethers";
import detectEthereumProvider from "@metamask/detect-provider";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/share/LoadingSpinner";
import { useState } from "react";

const HomeTemplate = () => {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [isLoading, setIsLoading] = useState(false);

    const handleConnectMetamask = async () => {
        try {
            setIsLoading(true);
            const provider: any = await detectEthereumProvider();

            if (provider) {
                const ethersProvider = new ethers.BrowserProvider(provider);
                const signer = await ethersProvider.getSigner();
                const currentAccount = await signer.getAddress();

                await signIn("login-with-id", {
                    redirect: false,
                    id: currentAccount,
                });

                await new Promise((resolve) => setTimeout(resolve, 3000));
                setIsLoading(false);
            } else {
                console.error("MetaMask provider not found.");
            }
            router.push("/hoi-nhom-binh-chon");
            setIsLoading(false);
        } catch (error: any) {
            console.error("Failed to initialize contract:", error?.message);
            setIsLoading(false);
        }
    };
    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="p-8 rounded-xl max-w-md w-full border border-gray-700">
                <h2 className="text-2xl text-center font-bold mb-6">
                    ĐĂNG NHẬP
                </h2>
                <div className="space-y-4">
                    <button
                        onClick={handleConnectMetamask}
                        className="w-full space-x-2 flex items-center justify-center text-black bg-white hover:bg-gray-100 font-semibold py-3 rounded-xl transition duration-300"
                    >
                        {isLoading ? (
                            <LoadingSpinner />
                        ) : (
                            <>
                                <Image
                                    priority
                                    width={20}
                                    height={20}
                                    alt=""
                                    className="w-5 h-5"
                                    src={`/static/images/connect/metamask.png`}
                                />
                                <span>Kết nối Metamask</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HomeTemplate;