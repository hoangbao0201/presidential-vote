"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import detectEthereumProvider from "@metamask/detect-provider";
import ContractABI from "@/data/abi.contract.json";
import { useRouter } from "next/navigation";
import { Toaster, toast } from 'sonner'

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

    console.log("id: ", id)

    const router = useRouter();
    const [electionDetail, setElectionDetail] = useState<ElectionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [winner, setWinner] = useState<{ name: string; votes: number } | null>(null);


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
                const contract = new ethers.Contract(ContractAddress, ContractABI, signer);

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
                const formattedCandidate: candidates[] = candidates.map((candidate: any) => ({
                    name: candidate.name,
                    votes: Number(candidate.votes),
                    imageUrl: candidate.imageUrl,
                }));
                setAllCandidates(formattedCandidate);

                // Check winner if election ended
                const currentTime = Math.floor(Date.now() / 1000);
                if (currentTime > Number(detail[1].toString())) {
                    const [winnerName, winnerVotes] = await contract.getElectionWinner(id);
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


    const vote = async (candidate: string) => {
        try {
            const provider: any = await detectEthereumProvider();
            if (provider) {
                const ethersProvider = new ethers.BrowserProvider(provider);
                const signer = await ethersProvider.getSigner();
                const contract = new ethers.Contract(ContractAddress, ContractABI, signer);

                const currentTime = Math.floor(Date.now() / 1000); // Lấy thời gian hiện tại (seconds)
                const endTime = Number(electionDetail?.endTime);

                // Kiểm tra xem cuộc bầu cử đã kết thúc chưa
                if (currentTime > endTime) {
                    toast.warning("Cuộc bầu cử đã kết thúc.");
                    return;
                }

                const userAddress = await signer.getAddress();

                if (!electionDetail?.allowedVoters.includes(userAddress)) {
                    toast.error("Không nằm trong danh sách được bầu cử");
                    return;
                }

                const tx = await contract.vote(id, candidate);
                await tx.wait(); // Chờ giao dịch hoàn tất

                toast.success("Bình chọn thành công!");

                await new Promise((resolve) => setTimeout(resolve, 2000));
                router.refresh();
            }
        } catch (error) {
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
                    console.log("Thời gian bầu cử đã kết thúc. Đang reload dữ liệu...");
                    clearInterval(interval); // Dừng interval khi đã hết thời gian
                    fetchElectionDetail();
                }
            }, 2000);
        }

        // Cleanup interval khi component unmount
        return () => clearInterval(interval);
    }, [electionDetail, winner]);


    if (loading) {
        return <p className="text-center">Đang tải chi tiết cuộc bầu cử...</p>;
    }

    if (!electionDetail) {
        return <p className="text-center">Dữ liệu cuộc bầu cử không tồn tại.</p>;
    }

    const sortedCandidates = getAllCandidates.sort((a, b) => b.votes - a.votes);
    return (
        <div className="flex justify-center items-center min-h-screen">
            <Toaster position="top-right" richColors />

            <div className="p-8 rounded-xl max-w-4xl w-full border border-gray-700 shadow-lg">
                {winner && (
                    <div className="text-center mt-8 p-4 border rounded-lg shadow-lg bg-green-600 text-white mb-8">
                        <h3 className="text-2xl font-bold">🎉 Người chiến thắng 🎉</h3>
                        <p className="text-lg mt-2">Ứng cử viên: <strong>{winner.name}</strong></p>
                        <p className="text-lg">Số phiếu bầu: <strong>{winner.votes}</strong></p>
                    </div>
                )}
                <h2 className="text-3xl text-center font-bold uppercase mb-8">
                    {electionDetail.name}
                </h2>
                <p className="text-lg mb-4">
                    Mô tả: {electionDetail.description}
                </p>
                <img
                    src={electionDetail.imageUrlElection}
                    alt="Ảnh cuộc bầu cử"
                    className="w-full h-64 object-cover rounded-lg mb-4"
                />
                <p className="text-lg font-medium mb-6">Danh sách ứng cử viên:</p>
                <ul className="space-y-6">
                    {sortedCandidates.map((candidate, index) => (
                        <li
                            key={index}
                            className="flex items-center justify-between p-4 border rounded-lg shadow-sm hover:shadow-md bg-gray-600"
                        >
                            <div className="-mr-56">
                                <h2 className="font-bold text-3xl text-cyan-400">{index + 1}</h2>
                            </div>
                            <div className="flex items-center flex-col">
                                <p className="font-semibold mr-2">
                                    Ứng cử viên: {candidate.name}
                                </p>
                                <img
                                    src={candidate.imageUrl}
                                    alt={candidate.name}
                                    className="w-24 h-24 object-cover rounded-lg mt-2"
                                />
                                <p>
                                    Số lượng phiếu bầu: <span>{candidate.votes}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => vote(candidate.name)}
                                className={`self-center py-2 px-8 rounded font-bold ${Math.floor(Date.now() / 1000) > Number(electionDetail?.endTime)
                                    ? "bg-gray-500 cursor-not-allowed"
                                    : "bg-cyan-600 hover:bg-cyan-400"
                                    }`}
                                disabled={Math.floor(Date.now() / 1000) > Number(electionDetail?.endTime)}
                            >
                                {Math.floor(Date.now() / 1000) > Number(electionDetail?.endTime)
                                    ? "Cuộc bầu cử đã kết thúc"
                                    : "Bình chọn"}
                            </button>
                        </li>
                    ))}
                </ul>


            </div>
        </div>
    );
};

export default GroupVotingDetailTemplate;
