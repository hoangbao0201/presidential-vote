"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import detectEthereumProvider from "@metamask/detect-provider";
import ContractABI from "@/data/abi.contract.json";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "sonner";
import LoadingSpinner from "@/components/share/LoadingSpinner";

const ContractAddress = "0xa68e6ad830078e12949fa966583E965349b6533e";

interface ElectionDetail {
    name: string;
    endTime: string;
    candidates: string[];
    allowedVoters: string[];
    imageUrls: string[];
    imageUrlElection: string;
    description: string;
}

const GroupVotingDetailTemplate = ({ id }: { id: string }) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const [electionDetail, setElectionDetail] = useState<ElectionDetail | null>(
        null
    );
    const [loading, setLoading] = useState(true);
    const [winner, setWinner] = useState<{
        name: string;
        votes: number;
    } | null>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    type candidates = {
        name: string;
        votes: number;
        imageUrl: string;
    };

    const [getAllCandidates, setAllCandidates] = useState<candidates[]>([]);

    const fetchElectionDetail = async () => {
        try {
            const provider: any = await detectEthereumProvider();

            if (provider) {
                const ethersProvider = new ethers.BrowserProvider(provider);
                const signer = await ethersProvider.getSigner();
                const contract = new ethers.Contract(
                    ContractAddress,
                    ContractABI,
                    signer
                );

                // Fetch election details
                const detail = await contract.detailElection(id);
                setElectionDetail({
                    name: detail[0],
                    endTime: detail[1].toString(),
                    candidates: detail[2],
                    allowedVoters: detail[3],
                    imageUrls: detail[4],
                    imageUrlElection: detail[5],
                    description: detail[6],
                });

                // Fetch candidates
                const candidates: any[] = await contract.getCandidates(id);
                const formattedCandidate: candidates[] = candidates.map(
                    (candidate: any) => ({
                        name: candidate.name,
                        votes: Number(candidate.votes),
                        imageUrl: candidate.imageUrl,
                    })
                );
                setAllCandidates(formattedCandidate);

                // Check winner if election ended
                const currentTime = Math.floor(Date.now() / 1000);
                if (currentTime > Number(detail[1].toString())) {
                    const [winnerName, winnerVotes] =
                        await contract.getElectionWinner(id);
                    setWinner({ name: winnerName, votes: Number(winnerVotes) });
                }

                setLoading(false);
            }
        } catch (error) {
            console.error("Error fetching election details:", error);
            toast.error("Không thể tải dữ liệu cuộc bầu cử.");
            setLoading(false);
        }
    };

    const vote = async (candidateName: string) => {
        setIsLoading(true);
        try {
            const provider: any = await detectEthereumProvider();
            if (provider) {
                const ethersProvider = new ethers.BrowserProvider(provider);
                const signer = await ethersProvider.getSigner();
                const contract = new ethers.Contract(
                    ContractAddress,
                    ContractABI,
                    signer
                );

                const currentTime = Math.floor(Date.now() / 1000); // Lấy thời gian hiện tại (seconds)
                const endTime = Number(electionDetail?.endTime);

                // Kiểm tra xem cuộc bầu cử đã kết thúc chưa
                if (currentTime > endTime) {
                    toast.warning("Cuộc bầu cử đã kết thúc.");
                    return;
                }

                const userAddress = await signer.getAddress();

                if (!electionDetail?.allowedVoters.includes(userAddress)) {
                    setIsLoading(false);

                    toast.error("Không nằm trong danh sách được bầu cử");
                    return;
                }

                const tx = await contract.vote(id, candidateName);
                await tx.wait(); // Chờ giao dịch hoàn tất

                setAllCandidates((prevCandidates) =>
                    prevCandidates.map((candidate) =>
                        candidate.name === candidateName
                            ? { ...candidate, votes: candidate.votes + 1 }
                            : candidate
                    )
                );
                setIsLoading(false);

                toast.success("Bình chọn thành công!");
            }
        } catch (error) {
            setIsLoading(false);
            console.error("Error voting:", error);
            toast.error("Bình chọn thất bại. Vui lòng thử lại.");
        }
    };

    useEffect(() => {
        if (id) {
            fetchElectionDetail();
        }
    }, [id]);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (electionDetail && !winner) {
            interval = setInterval(() => {
                const currentTime = Math.floor(Date.now() / 1000);
                const endTime = Number(electionDetail.endTime);

                if (currentTime > endTime) {
                    console.log(
                        "Thời gian bầu cử đã kết thúc. Đang reload dữ liệu..."
                    );
                    clearInterval(interval); // Dừng interval khi đã hết thời gian
                    fetchElectionDetail();
                }
            }, 2000);
        }

        // Cleanup interval khi component unmount
        return () => clearInterval(interval);
    }, [electionDetail, winner]);

    useEffect(() => {
        if (electionDetail) {
            const updateCountdown = () => {
                const currentTime = Math.floor(Date.now() / 1000); // Thời gian hiện tại (giây)
                const endTime = Number(electionDetail.endTime); // Thời gian kết thúc (giây)
                const remainingTime = endTime - currentTime; // Thời gian còn lại (giây)

                setTimeLeft(remainingTime > 0 ? remainingTime : 0); // Đảm bảo không có giá trị âm
            };

            updateCountdown(); // Cập nhật ngay khi component mount

            const interval = setInterval(updateCountdown, 1000); // Cập nhật mỗi giây

            // Cleanup interval khi component bị unmount
            return () => clearInterval(interval);
        }
    }, [electionDetail]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600)
            .toString()
            .padStart(2, "0");
        const m = Math.floor((seconds % 3600) / 60)
            .toString()
            .padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${h}:${m}:${s}`;
    };

    if (loading) {
        return <p className="text-center">Đang tải chi tiết cuộc bầu cử...</p>;
    }

    if (!electionDetail) {
        return (
            <p className="text-center">Dữ liệu cuộc bầu cử không tồn tại.</p>
        );
    }

    const sortedCandidates = getAllCandidates.sort((a, b) => b.votes - a.votes);
    return (
        <div className="flex justify-center items-center min-h-screen text-white ">
            <Toaster position="top-right" richColors />

            <div className="w-full max-w-5xl p-6">
                {/* Thời gian */}


                {/* Thông tin cuộc bầu cử */}
                <div className="p-8 w-full rounded-xl mt-16 bg-black bg-opacity-65 shadow-xl z-10 backdrop-blur-sm">
                    {winner && (
                        <div className="text-center p-4 mb-8 border rounded-lg shadow-md bg-green-600 text-white">
                            <h3 className="text-2xl font-bold">
                                🎉 Người chiến thắng 🎉
                            </h3>
                            <p className="text-lg mt-2">
                                Ứng cử viên: <strong>{winner.name}</strong>
                            </p>
                            <p className="text-lg">
                                Số phiếu bầu: <strong>{winner.votes}</strong>
                            </p>
                        </div>
                    )}

                    <div className="text-center mb-6">
                        {timeLeft !== null && timeLeft > 0 ? (
                            <p className="text-lg font-medium">
                                ⏳ Thời gian còn lại:{" "}
                                <span className="font-bold">{formatTime(timeLeft)}</span>
                            </p>
                        ) : (
                            <p className="text-lg font-medium text-red-600">
                                ⏳ Cuộc bầu cử đã kết thúc!
                            </p>
                        )}
                    </div>

                    <h2 className="text-3xl text-center font-bold uppercase mb-6">
                        {electionDetail.name}
                    </h2>
                    <p className="text-lg mb-4">Mô tả: {electionDetail.description}</p>

                    <img
                        src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/` + electionDetail.imageUrlElection}
                        alt="Ảnh cuộc bầu cử"
                        className="w-4/6 h-64 object-contain rounded-lg mb-6 mx-auto"
                    />

                    <p className="text-lg font-medium mb-6">Danh sách ứng cử viên:</p>


                    <ul className="flex flex-col space-y-6">
                        {sortedCandidates.map((candidate, index) => (
                            <li
                                key={index}
                                className="flex items-center justify-between p-6 border rounded-lg shadow-md bg-slate-800 bg-opacity-70 backdrop-blur-sm hover:shadow-lg "
                            >

                                <div className="text-center w-16">
                                    <h2 className="text-3xl font-bold text-cyan-400">
                                        {index + 1}
                                    </h2>
                                </div>


                                <div className="flex-1 px-4">
                                    <h3 className="text-xl font-semibold mb-2">
                                        {candidate.name}
                                    </h3>
                                    <img
                                        src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/` + candidate.imageUrl}
                                        alt={candidate.name}
                                        className="w-24 h-24 object-cover rounded-lg mb-2"
                                    />
                                    <p className="text-lg">
                                        Số lượng phiếu bầu:{" "}
                                        <strong>{candidate.votes}</strong>
                                    </p>
                                </div>


                                <div className="flex-shrink-0">
                                    <button
                                        onClick={() => vote(candidate.name)}
                                        className={`py-2 px-6 rounded font-bold text-white ${Math.floor(Date.now() / 1000) >
                                            Number(electionDetail?.endTime)
                                            ? "bg-gray-500 cursor-not-allowed"
                                            : "bg-cyan-600 hover:bg-cyan-400"
                                            }`}
                                        disabled={
                                            Math.floor(Date.now() / 1000) >
                                            Number(electionDetail?.endTime)
                                        }
                                    >
                                        {isLoading ? (
                                            <LoadingSpinner />
                                        ) : (
                                            <>
                                                {Math.floor(Date.now() / 1000) >
                                                    Number(electionDetail?.endTime)
                                                    ? "Cuộc bầu cử đã kết thúc"
                                                    : "Bình chọn"}
                                            </>
                                        )}
                                    </button>

                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );


};

export default GroupVotingDetailTemplate;
