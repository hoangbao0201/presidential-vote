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

                const signInResponse = await signIn("login-with-id", {
                    redirect: false,
                    id: currentAccount,
                });

                // Kiểm tra xem session đã lưu chưa
                if (signInResponse?.ok) {
                    console.log("Đăng nhập thành công");
                } else {
                    console.error("Lỗi đăng nhập");
                }

                await new Promise((resolve) => setTimeout(resolve, 2000));
            } else {
                console.error("MetaMask provider not found.");
            }
            setIsLoading(false);
            router.push("/hoi-nhom-binh-chon");
        } catch (error: any) {
            console.error("Failed to initialize contract:", error?.message);
            setIsLoading(false);
        }
    };
    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="p-8 rounded-xl max-w-md w-full border border-gray-700 bg-black bg-opacity-50 shadow-xl z-10 backdrop-blur-sm">
                <h2 className="text-2xl text-center font-bold mb-6">
                    ĐĂNG NHẬP
                </h2>
                <div className="space-y-4">
                    <button
                        onClick={handleConnectMetamask}
                        className="w-full space-x-2 flex items-center justify-center text-black bg-white hover:bg-gray-500 hover:cursor-pointer font-semibold py-3 rounded-xl transition duration-300"
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
