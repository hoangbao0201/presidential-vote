import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const Header = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    
    const handleNavigation = () => {
        if (status === "authenticated") {
            router.push("/hoi-nhom-binh-chon"); // Chuyển trang khi người dùng đã đăng nhập
        } 
    };

    return (
        <header className="w-full border-b mb-5 fixed bg-zinc-900 z-50 border-none shadow-lg mt-0">
            
            <div className="h-[55px] max-w-screen-lg mx-auto flex items-center justify-between">
                <span
                    className="text-3xl font-bold text-amber-500 hover:cursor-pointer hover:text-amber-300"
                    onClick={handleNavigation} // Sử dụng hàm xử lý điều hướng
                >
                    Votting
                </span>
                {status === "authenticated" && (
                    <button
                        className="bg-red-500 rounded-md px-2 py-1 text-white hover:bg-red-800"
                        onClick={() => {
                            signOut({ callbackUrl: "/" });
                        }}
                    >
                        Đăng xuất
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
