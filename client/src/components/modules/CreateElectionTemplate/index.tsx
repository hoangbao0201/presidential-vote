"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { ethers } from "ethers";

import ContractABI from "@/data/abi.contract.json";
import detectEthereumProvider from "@metamask/detect-provider";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/share/LoadingSpinner";
import { Toaster, toast } from "sonner";

type ElectionData = {
    name: string;
    durationInMinutes: number;
    candidates: string[];
    imageUrl: string[];
    imageUrlElection: string;
    allowedVoters: string[];
    describe: string;
};

const CreateElectionPage = () => {
    const router = useRouter();

    const { data: session } = useSession();
    const [isAdmin, setIsAdmin] = useState(false);

    const [isLoading, setIsLoading] = useState(false);

    const [files, setFiles] = useState<{
        fileDataImageGroupVote: File | null,
        fileDataImageCadidate: Record<string, File> | null,
    }>({
        fileDataImageGroupVote: null,
        fileDataImageCadidate: {},
    });

    const [electionData, setElectionData] = useState<ElectionData>({
        name: "",
        durationInMinutes: 1,
        candidates: [],
        imageUrl: [],
        imageUrlElection: "",
        allowedVoters: [],
        describe: "",
    });

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            return event.target.files[0];
        }
    };

    const handleUpload = async (file: File): Promise<string | null> => {
        if (!file) {
            alert("Please select an image file first.");
            return null;
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const base64 = event.target?.result;
                if (base64) {
                    try {
                        const response = await fetch("/api/upload/image", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ file: base64 }),
                        });

                        const data = await response.json();

                        if (response.ok) {
                            resolve(data.url);
                        } else {
                            reject("Upload failed.");
                        }
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    reject("Failed to read file.");
                }
            };

            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    };

    const handleCreateElection = async () => {
        setIsLoading(true);
        try {
            const provider: any = await detectEthereumProvider();

            if (provider) {
                const ethersProvider = new ethers.BrowserProvider(provider);
                const signer = await ethersProvider.getSigner();

                const contract = new ethers.Contract(
                    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string,
                    ContractABI,
                    signer
                );

                const uploadedImageUrlElection = files.fileDataImageGroupVote
                    ? await handleUpload(files.fileDataImageGroupVote)
                    : null;
                if (!uploadedImageUrlElection) {
                    toast.error("Failed to upload the election image.");
                    return;
                }

                let uploadedImageUrlsCandidates: Record<string, string> = {};
                if (files.fileDataImageCadidate) {
                    for (const [candidateId, file] of Object.entries(
                        files.fileDataImageCadidate
                    )) {
                        const uploadedUrl = await handleUpload(file);
                        if (uploadedUrl) {
                            uploadedImageUrlsCandidates[candidateId] = uploadedUrl;
                        } else {
                            toast.error(`Failed to upload image for candidate ${candidateId}`);
                        }
                    }
                }

                // Gọi hàm createElection từ hợp đồng
                const tx = await contract.createElection(
                    electionData.name,
                    electionData.durationInMinutes,
                    electionData.candidates,
                    Object.entries(uploadedImageUrlsCandidates).map(([key, value]) => value),
                    uploadedImageUrlElection,
                    electionData.allowedVoters,
                    electionData.describe
                );

                console.log("Giao dịch đã được gửi, chờ xác nhận...");
                // Đợi giao dịch được xác nhận
                await tx.wait();
                console.log("Giao dịch đã được xác nhận!");

                setIsLoading(false);

                toast.success("Cuộc bầu cử đã được tạo thành công!");

                await new Promise((resolve) => setTimeout(resolve, 5000));
                router.push("/hoi-nhom-binh-chon");
            }
        } catch (error: any) {
            console.error("Lỗi khi tạo cuộc bầu cử:", error);

            if (error.code) {
                console.log("Mã lỗi:", error.code);
            }

            // Kiểm tra lỗi cụ thể từ error.message hoặc error.code
            if (error.code === "NETWORK_ERROR") {
                toast.error("Lỗi mạng: Không thể kết nối tới mạng Ethereum.");
            } else if (error.code === "INSUFFICIENT_FUNDS") {
                toast.error("Không đủ ETH để thực hiện giao dịch.");
            } else if (error.data?.message) {
                toast.error(`Lỗi từ hợp đồng: ${error.data.message}`);
            } else {
                toast.error(
                    "Có lỗi xảy ra khi tạo cuộc bầu cử. Vui lòng thử lại."
                );
            }
        }
    };

    useEffect(() => {
        const checkIfAdmin = async () => {
            if (session?.user?.id) {
                const provider: any = await detectEthereumProvider();

                if (provider) {
                    const ethersProvider = new ethers.BrowserProvider(provider);
                    const signer = await ethersProvider.getSigner();
                    try {
                        console.log("signer: ", signer);
                        const contract = new ethers.Contract(
                            process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string,
                            ContractABI,
                            signer
                        );

                        // Lấy địa chỉ owner (admin) từ hợp đồng
                        const ownerAddress = await contract.owner();
                        console.log(ownerAddress);
                        const userAddress = session.user.id;
                        console.log(userAddress);
                        // Kiểm tra nếu địa chỉ ví người dùng là admin
                        if (
                            ownerAddress.toLowerCase() ===
                            userAddress.toLowerCase()
                        ) {
                            setIsAdmin(true); // Người dùng là admin
                        } else {
                            setIsAdmin(false); // Người dùng không phải admin
                        }
                    } catch (error) {
                        console.error("Error checking admin:", error);
                    }
                }
            }
        };

        checkIfAdmin();
    }, [session]);

    console.log("files: ", files)

    return (
        <div className="flex justify-center items-center min-h-screen">
            <Toaster position="top-right" richColors />

            <div className="mt-16 p-8 rounded-xl max-w-2xl w-full border border-gray-700 bg-black bg-opacity-65 shadow-xl z-10 backdrop-blur-sm">
                <h2 className="text-2xl text-center font-bold uppercase mb-6">
                    Tạo Cuộc Bầu Cử
                </h2>

                {isAdmin ? (
                    <div>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold">
                                Tên cuộc bầu cử
                            </label>
                            <input
                                type="text"
                                className="mt-2 p-2 border rounded-md w-full text-black"
                                value={electionData.name}
                                onChange={(e) =>
                                    setElectionData({
                                        ...electionData,
                                        name: e.target.value,
                                    })
                                }
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-semibold">
                                Thời gian cuộc bầu cử (phút)
                            </label>
                            <input
                                type="number"
                                min="1"
                                className="mt-2 p-2 border rounded-md w-full text-black"
                                value={electionData.durationInMinutes}
                                onChange={(e) =>
                                    setElectionData({
                                        ...electionData,
                                        durationInMinutes: +e.target.value,
                                    })
                                }
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-semibold">
                                Danh sách ứng cử viên
                            </label>
                            <input
                                type="text"
                                className="mt-2 p-2 border rounded-md w-full text-black"
                                placeholder="Nhập tên ứng cử viên"
                                onKeyDown={(e) => {
                                    if (
                                        e.key === "Enter" &&
                                        (e.target as HTMLInputElement).value
                                    ) {
                                        setElectionData({
                                            ...electionData,
                                            candidates: [
                                                ...electionData.candidates,
                                                (e.target as HTMLInputElement)
                                                    .value,
                                            ],
                                        });
                                        (e.target as HTMLInputElement).value =
                                            ""; // Clear the input after adding
                                    }
                                }}
                            />
                            <div className="mt-2">
                                {electionData.candidates.map(
                                    (candidate, index) => (
                                        <div
                                            key={index}
                                            className="linline-block mr-2 bg-gray-400 p-1 rounded text-black overflow-x-auto whitespace-nowrap"
                                        >
                                            <div>{candidate}</div>

                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="mt-2 p-2 border rounded-md w-full text-black"
                                                value={electionData.imageUrlElection}
                                                onChange={async (e) => {
                                                    const file = handleFileChange(e);
                                                    if (file) {
                                                        setFiles(state => ({
                                                            ...state,
                                                            fileDataImageCadidate: {
                                                                ...state.fileDataImageCadidate,
                                                                [candidate]: file,
                                                            },
                                                        }))
                                                    }
                                                }}
                                            />
                                        </div>
                                    )
                                )}
                            </div>
                        </div>

                        {/* <div className="mb-4">
                            <label className="block text-sm font-semibold">
                                URL ảnh ứng cử viên
                            </label>
                            <input
                                type="text"
                                className="mt-2 p-2 border rounded-md w-full text-black"
                                onKeyDown={(e) => {
                                    if (
                                        e.key === "Enter" &&
                                        (e.target as HTMLInputElement).value
                                    ) {
                                        setElectionData({
                                            ...electionData,
                                            imageUrl: [
                                                ...electionData.imageUrl,
                                                (e.target as HTMLInputElement)
                                                    .value,
                                            ],
                                        });
                                        (e.target as HTMLInputElement).value =
                                            ""; // Clear the input after adding
                                    }
                                }}
                            />
                            <div className="mt-2">
                                {electionData.imageUrl.map(
                                    (imageUrl, index) => (
                                        <div
                                            key={index}
                                            className="block mr-2 bg-gray-400 p-1 rounded text-black overflow-hidden whitespace-nowrap w-full mb-1"
                                        >
                                            <div>{imageUrl}</div>
                                            
                                        </div>
                                    )
                                )}
                            </div>
                        </div> */}

                        <div className="mb-4">
                            <label className="block text-sm font-semibold">
                                Danh sách người tham gia bầu cử
                            </label>
                            <input
                                type="text"
                                className="mt-2 p-2 border rounded-md w-full text-black"
                                placeholder="Nhập danh sách địa chỉ người tham gia bầu cử, ví dụ (0x...bcae)"
                                onKeyDown={(e) => {
                                    if (
                                        e.key === "Enter" &&
                                        (e.target as HTMLInputElement).value
                                    ) {
                                        setElectionData({
                                            ...electionData,
                                            allowedVoters: [
                                                ...electionData.allowedVoters,
                                                (e.target as HTMLInputElement)
                                                    .value,
                                            ],
                                        });
                                        (e.target as HTMLInputElement).value =
                                            ""; // Clear the input after adding
                                    }
                                }}
                            />
                            <div className="mt-2">
                                {electionData.allowedVoters.map(
                                    (allowedVoters, index) => (
                                        <span
                                            key={index}
                                            className="block mr-2 bg-gray-400 p-1 rounded text-black overflow-hidden whitespace-nowrap w-full mb-1"
                                        >
                                            {allowedVoters}
                                        </span>
                                    )
                                )}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-semibold">
                                URL ảnh cuộc bầu cử
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                className="mt-2 p-2 border rounded-md w-full text-white"
                                value={electionData.imageUrlElection}
                                onChange={async (e) => {
                                    const file = handleFileChange(e);
                                    if (file) {
                                        setFiles(state => ({
                                            ...state,
                                            fileDataImageGroupVote: file,
                                        }))
                                    }
                                }}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-semibold">
                                Mô tả cuộc bầu cử
                            </label>
                            <textarea
                                className="mt-2 p-2 border rounded-md w-full text-black"
                                value={electionData.describe}
                                onChange={(e) =>
                                    setElectionData({
                                        ...electionData,
                                        describe: e.target.value,
                                    })
                                }
                            />
                        </div>

                        <button
                            onClick={handleCreateElection}
                            className="mt-4 py-2 px-10 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 ml-[50%] translate-x-[-50%]"
                        >

                            {isLoading ? (
                                <LoadingSpinner />
                            ) : (
                                <>
                                    <span>Tạo cuộc bầu cử</span>
                                </>
                            )}
                            
                        </button>
                    </div>
                ) : (
                    <p className="text-red-500">
                        Bạn không có quyền tạo cuộc bầu cử.
                    </p>
                )}
            </div>
        </div>
    );
};

export default CreateElectionPage;




