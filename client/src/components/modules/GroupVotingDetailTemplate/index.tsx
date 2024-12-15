"use client";

import Link from "next/link";
import { useState } from "react";

const GroupVotingDetailTemplate = () => {
    const [dataGroupVoting, setDataGroupVoting] = useState({
        id: "id_group_1",
        title: "ANIME HAY NHẤT 2024",
    })
    const [dataListCandidate, setDataListCandidate] = useState([
        {
            id: "id_candidate_1",
            name: "Ứng cử viên 1",
            imageUrl: "/static/images/default-avatar.jpg",
            totalVotes: 4,
        },
        {
            id: "id_candidate_2",
            name: "Ứng cử viên 2",
            imageUrl: "/static/images/default-avatar.jpg",
            totalVotes: 10,
        },
    ]);

    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="p-8 rounded-xl max-w-7xl w-full border border-gray-700 shadow-lg">
                <h2 className="text-3xl text-center font-bold uppercase mb-8">
                    {dataGroupVoting?.title}
                </h2>
                <p className="text-lg font-medium mb-6">
                    Danh Sách Ứng Cử
                </p>
                <ul className="space-y-6">
                    {dataListCandidate.map((group) => (
                        <li
                            key={group.id}
                            className="flex items-center p-6 border border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 bg-gray-50 hover:bg-gray-100"
                        >
                            {/* Ứng cử viên hình ảnh */}
                            <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-full">
                                <img
                                    src={group.imageUrl}
                                    alt={group.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Nội dung */}
                            {/* Nội dung */}
                            <div className="ml-6 flex-1">
                                <h3 className="text-xl font-semibold text-gray-800">
                                    {group.name}
                                </h3>
                                <p className="mt-3 text-gray-700 font-medium">
                                    Số lượng phiếu bầu: {group.totalVotes}
                                </p>
                            </div>

                            {/* Nút hành động */}
                            <button
                                title={`Bình chọn cho ${group.id}`}
                            >
                                <button className="py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200">
                                    Tham gia bình chọn
                                </button>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default GroupVotingDetailTemplate;
