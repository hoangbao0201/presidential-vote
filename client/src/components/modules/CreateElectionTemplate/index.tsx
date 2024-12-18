"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { ethers } from "ethers";

import ContractABI from "@/data/abi.contract.json";
import detectEthereumProvider from "@metamask/detect-provider";
import { useRouter } from "next/navigation";

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

    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

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
            setFile(event.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            alert("Please select an image file first.");
            return;
        }

        setUploading(true);

        // Convert file to Base64
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = async () => {
            const base64 = reader.result;

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
                    setImageUrl(data.url);
                    alert("Image uploaded successfully!");
                } else {
                    alert(`Upload failed: ${data.error || "Unknown error"}`);
                }
            } catch (error) {
                console.error("Error uploading image:", error);
                alert("An unexpected error occurred.");
            } finally {
                setUploading(false);
            }
        };

        reader.onerror = () => {
            alert("Failed to read file.");
            setUploading(false);
        };
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

    const handleCreateElection = async () => {
        try {
            const provider: any = await detectEthereumProvider();

            if (provider) {
                const ethersProvider = new ethers.BrowserProvider(provider);
                const signer = await ethersProvider.getSigner();

                console.log(signer);
                const contract = new ethers.Contract(
                    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string,
                    ContractABI,
                    signer
                );

                console.log("Đang gọi hàm createElection...");
                // Gọi hàm createElection từ hợp đồng
                const tx = await contract.createElection(
                    electionData.name,
                    electionData.durationInMinutes,
                    electionData.candidates,
                    electionData.imageUrl,
                    electionData.imageUrlElection,
                    electionData.allowedVoters,
                    electionData.describe
                );

                console.log("Giao dịch đã được gửi, chờ xác nhận...");
                // Đợi giao dịch được xác nhận
                await tx.wait();
                console.log("Giao dịch đã được xác nhận!");

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

    return (
        <div className="flex justify-center items-center min-h-screen">
            <input type="file" accept="image/*" onChange={handleFileChange} />
            <button onClick={handleUpload} disabled={uploading}>
                {uploading ? "Uploading..." : "Upload"}
            </button>
            {imageUrl && (
                <div>
                    <h2>Uploaded Image:</h2>
                    <img
                        src={imageUrl}
                        alt="Uploaded"
                        style={{ maxWidth: "100%" }}
                    />
                </div>
            )}

            <Toaster position="top-right" richColors />

            <div className="p-8 rounded-xl max-w-2xl w-full border border-gray-700 shadow-lg">
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
                                        <span
                                            key={index}
                                            className="linline-block mr-2 bg-gray-400 p-1 rounded text-black overflow-x-auto whitespace-nowrap"
                                        >
                                            {candidate}
                                        </span>
                                    )
                                )}
                            </div>
                        </div>

                        <div className="mb-4">
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
                                        <span
                                            key={index}
                                            className="block mr-2 bg-gray-400 p-1 rounded text-black overflow-hidden whitespace-nowrap w-full mb-1"
                                        >
                                            {imageUrl}
                                        </span>
                                    )
                                )}
                            </div>
                        </div>

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
                                type="text"
                                className="mt-2 p-2 border rounded-md w-full text-black"
                                value={electionData.imageUrlElection}
                                onChange={(e) =>
                                    setElectionData({
                                        ...electionData,
                                        imageUrlElection: e.target.value,
                                    })
                                }
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
                            Tạo cuộc bầu cử
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
