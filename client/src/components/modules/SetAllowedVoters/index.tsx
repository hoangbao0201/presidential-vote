"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";

import ContractABI from "@/data/abi.contract.json";
import detectEthereumProvider from "@metamask/detect-provider";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/share/LoadingSpinner";

import { Toaster, toast } from 'sonner'

const ContractAddress = "0xa68e6ad830078e12949fa966583E965349b6533e";

const SetAllowedVoters = ({ id }: { id: string }) => {

    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const [newVoters, setNewVoters] = useState<string[]>([]);

    const setAllowedVotersHandler = async () => {
        if (newVoters.length === 0) return toast.error("Vui lòng cung cấp ít nhất một cử tri.");
        setIsLoading(true);
        try {
            const provider: any = await detectEthereumProvider();
            if (provider) {
                const ethersProvider = new ethers.BrowserProvider(provider);
                const signer = await ethersProvider.getSigner();
                const contract = new ethers.Contract(ContractAddress, ContractABI, signer);

                const transaction = await contract.setAllowedVoters(id, newVoters);
                await transaction.wait();
                setIsLoading(false);
                toast.success("Cập nhật cử tri thành công!");
            }
        } catch (error) {
            setIsLoading(false);
            console.error("Cập nhật cử tri thất bại:", error);
            toast.error("Lỗi khi cập nhật cử tri.");
        }

        setIsLoading(false);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        router.push("/hoi-nhom-binh-chon");
    };


    return (
        <div className="flex justify-center items-center min-h-screen">

            <Toaster position="top-right" richColors />

            <div className="p-8 rounded-xl max-w-2xl w-full border border-gray-700 bg-black bg-opacity-65 shadow-xl z-10 backdrop-blur-sm">
                <h2 className="text-2xl text-center font-bold uppercase mb-6">Cập Nhật Danh Sách Địa Chỉ Bầu Cử</h2>

                <div className="mb-4">
                    <label className="block text-sm font-semibold">Danh sách địa chỉ bầu cử</label>
                    <input
                        type="text"
                        className="mt-2 p-2 border rounded-md w-full text-black"
                        placeholder="Nhập địa chỉ(0x...eacb) và nhấn Enter"
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.target as HTMLInputElement).value) {
                                setNewVoters([...newVoters, (e.target as HTMLInputElement).value]);
                                (e.target as HTMLInputElement).value = "";
                            }
                        }}
                    />
                    <div className="mt-2">
                        {newVoters.map((voter, index) => (
                            <span
                                key={index}
                                className="block mr-2 bg-gray-400 p-1 rounded text-black overflow-hidden whitespace-nowrap w-full mb-1"
                            >
                                {voter}
                            </span>
                        ))}
                    </div>
                </div>

                <button
                    onClick={setAllowedVotersHandler}
                    className="mt-4 py-2 px-10 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 w-full"
                >
                    {isLoading ? (
                        <LoadingSpinner />
                    ) : (
                        <>
                         <span>Cập nhật</span>
                        </>
                    )}              
                </button>
            </div>
        </div>
    );
};

export default SetAllowedVoters;
