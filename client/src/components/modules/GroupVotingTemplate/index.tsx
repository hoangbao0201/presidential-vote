"use client"

import Link from "next/link";
import { useState } from "react";

const GroupVotingTemplate = () => {
    const [dataListGroup, setDataListGroup] = useState([
        {
            id: "id_1",
            title: "Title 1",
        },
        {
            id: "id_2",
            title: "Title 2",
        },
        {
            id: "id_3",
            title: "Title 3",
        },
    ]);

    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="p-8 rounded-xl max-w-7xl w-full border border-gray-700 shadow-lg">
                <h2 className="text-2xl text-center font-bold uppercase mb-6">Danh Sách Nhóm Bình Chọn</h2>
                
                <ul className="space-y-4">
                    {dataListGroup.map((group) => (
                        <li key={group.id} className="p-4 border border-gray-700 rounded-lg transition duration-300">
                            <Link href={"/hoi-nhom-binh-chon/" + group.id} title={group.title}>
                                <div>
                                    <h3 className="text-lg font-semibold">{group.title}</h3>
                                    <p className="text-[#b7bdc6]">Mô tả</p>
                                    <button className="mt-2 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200">
                                        Tham gia bình chọn
                                    </button>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default GroupVotingTemplate;
