"use client";

import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";

import { ethers } from "ethers";
import detectEthereumProvider from "@metamask/detect-provider";
import ContractABI from "@/data/abi.contract.json"

import { Toaster, toast } from 'sonner'
import LoadingSpinner from "@/components/share/LoadingSpinner";

const ContractAddress = "0xa68e6ad830078e12949fa966583E965349b6533e";

const GroupVotingTemplate = () => {
    const { data: session } = useSession();
    const [isOwner, setIsOwner] = useState(false);

    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const [isLoading, setIsLoading] = useState(false);


    const [electionToDelete, setElectionToDelete] = useState<number | null>(null); // State lưu id cuộc bầu cử cần xóa

    type ElectionData = {
        id: number;
        name: string;
        imageUrlElection: string;
    };

    const [getAllElection, setAllElection] = useState<ElectionData[]>([]);

    useEffect(() => {
        const checkIfAdmin = async () => {

            if (session?.user?.id) {
                const provider: any = await detectEthereumProvider();

                if (provider) {
                    const ethersProvider = new ethers.BrowserProvider(provider);
                    const signer = await ethersProvider.getSigner();
                    try {
                        console.log("signer: ", signer)
                        const contract = new ethers.Contract(ContractAddress, ContractABI, signer);

                        const ownerAddress = await contract.owner();
                        const userAddress = session.user.id;

                        if (ownerAddress.toLowerCase() === userAddress.toLowerCase()) {
                            setIsOwner(true);
                        } else {
                            setIsOwner(false);
                        }
                    } catch (error) {
                        console.error("Error checking admin:", error);
                    }
                }

            }
        };

        checkIfAdmin();
    }, [session]);



    const fetchElectionList = async () => {
        try {
            const provider: any = await detectEthereumProvider();

            if (provider) {
                const ethersProvider = new ethers.BrowserProvider(provider);
                const signer = await ethersProvider.getSigner();

                const contract = new ethers.Contract(ContractAddress, ContractABI, signer);

                const elections: any[] = await contract.getAllElectionNames();

                const formattedElections: ElectionData[] = elections.map((election: any) => ({
                    id: Number(election.idElection),
                    name: election.name,
                    imageUrlElection: election.imageUrlElection,
                }));

                console.log(formattedElections);

                setAllElection(formattedElections);
                setLoading(false);
            }
        } catch (error) {
            console.error("Failed to fetch elections:", error);
            setLoading(false);
        }
    };



    const deleteElectionHandler = async (electionId: number) => {
        // Hiển thị modal khi nhấn "Xóa"
        setElectionToDelete(electionId);
        setIsModalOpen(true);
    };

    const confirmDelete = async () => {
        // Gọi hàm xóa cuộc bầu cử
        if (!electionToDelete) return;

        setIsLoading(true);

        try {
            const provider: any = await detectEthereumProvider();
            if (provider) {
                const ethersProvider = new ethers.BrowserProvider(provider);
                const signer = await ethersProvider.getSigner();
                const contract = new ethers.Contract(ContractAddress, ContractABI, signer);

                const transaction = await contract.deleteElection(electionToDelete);
                await transaction.wait();  // Chờ giao dịch được khai thác

                setIsLoading(false);
                toast.success("Xóa cuộc bầu cử thành công!");

                // Cập nhật lại danh sách cuộc bầu cử sau khi xóa
                const elections: any[] = await contract.getAllElectionNames();
                const formattedElections = elections.map((election: any) => ({
                    id: Number(election.idElection),
                    name: election.name,
                    imageUrlElection: election.imageUrlElection,
                }));
                // Cập nhật state với danh sách bầu cử mới
                setAllElection(formattedElections);
                setIsModalOpen(false);
            }
        } catch (error) {
            setIsLoading(false);
            console.error("Lỗi khi xóa cuộc bầu cử", error);
            toast.error("Lỗi khi xóa cuộc bầu cử.");
            setIsModalOpen(false);
        }
    };

    const cancelDelete = () => {
        setIsModalOpen(false);
    };


    useEffect(() => {
        fetchElectionList();
    }, []);

    return (
        <div className="flex justify-center items-center min-h-screen">
            {/* Modal Confirmation */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-md flex justify-center items-center z-20">
                    <div className="bg-slate-800 p-6 rounded-lg shadow-lg max-w-sm w-full">
                        <h3 className="text-xl font-semibold mb-4 text-center">Bạn chắc chắn muốn xóa cuộc bầu cử này?</h3>
                        <div className="flex justify-center items-center">
                            
                            {isLoading ? (
                                <div className="bg-green-500 py-2 px-4 rounded-lg">
                                    <LoadingSpinner fill="#ffff" />
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={confirmDelete}
                                        className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition duration-200 mr-16">
                                        Yes
                                    </button>
                                    <button
                                        onClick={cancelDelete}
                                        className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition duration-200">
                                        No
                                    </button>
                                </>

                            )}
                        </div>
                    </div>
                </div>
            )}

            <Toaster position="top-right" richColors />

            <div className="p-8 rounded-xl max-w-5xl w-full border border-gray-700 mt-16 bg-black bg-opacity-65 shadow-xl z-10 backdrop-blur-sm">
                <h2 className="text-2xl text-center font-bold uppercase mb-6">Danh Sách Nhóm Bình Chọn</h2>

                {session?.user?.id && (
                    <div className="mb-4 text-center">
                        <p className="text-lg">Địa chỉ ví của bạn: {session.user.id}</p>
                        {isOwner && (
                            <p className="text-green-500 font-semibold">(ADMIN)</p>
                        )}
                    </div>
                )}


                {isOwner && (
                    <div className="mb-6 text-center">
                        <Link href="/tao-bau-cu">
                            <button className="py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200">
                                Tạo Cuộc Bầu Cử
                            </button>
                        </Link>
                    </div>
                )}

                {/* <LoadingSpinner fill="#ffff"/> */}
                {loading ? (
                    <p className="text-center">Đang tải danh sách cuộc bầu cử...</p>
                ) : (
                    <ul className="space-y-4 rounded-lg bg-opacity-70 backdrop-blur-sm">
                        {getAllElection.map((election) => (
                            <li key={election.id} className="p-4 border bg-slate-800 bg-opacity-70 backdrop-blur-sm border-gray-700 rounded-lg transition duration-300 flex justify-between items-center">

                                <div className="w-2/3">
                                    <h3 className="text-lg font-semibold">{election.name}</h3>
                                    {/* <p className="text-[#b7bdc6]">Mô tả: {election.id}</p> */}
                                    <img
                                        src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/` + election.imageUrlElection}
                                        alt={"Ảnh cuộc bầu cử"}
                                        className="w-2/3 h-32 object-contain rounded-lg mb-2"
                                    />
                                </div>
                                <div className="flex flex-col items-start">
                                    <Link href={`/hoi-nhom-binh-chon/${election.id}`} title={election.name}>
                                        <button className="opacity-70 mt-2 py-2 px-4 w-60 bg-blue-500 text-white rounded-lg hover:bg-blue-600 hover:opacity-100 transition duration-200">
                                            Tham gia bình chọn
                                        </button>
                                    </Link>
                                    {isOwner && (<>
                                        <Link href={`/sua-cu-tri/${election.id}`} title={election.name}>
                                            <button className="opacity-70 mt-2 py-2 px-4 w-60 bg-lime-700 text-white rounded-lg hover:bg-lime-400 hover:opacity-100 transition duration-200">
                                                Sửa cử tri
                                            </button>
                                        </Link>


                                        <Link href={`/sua-dia-chi-bau-cu/${election.id}`} title={election.name}>
                                            <button className="opacity-70 mt-2 py-2 px-4 w-60 bg-yellow-500 text-white rounded-lg hover:bg-yellow-300 hover:opacity-100 transition duration-200">
                                                Sửa địa chỉ bình chọn
                                            </button>
                                        </Link>


                                        <button
                                            onClick={() => deleteElectionHandler(election.id)}
                                            className="opacity-70 mt-2 py-2 px-4 w-60 bg-red-700 text-white rounded-lg hover:bg-red-500 hover:opacity-100 transition duration-200">
                                            Xóa cuộc bình chọn
                                        </button>


                                    </>)}
                                </div>

                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default GroupVotingTemplate;
