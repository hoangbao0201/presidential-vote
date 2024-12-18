import { signOut, useSession } from "next-auth/react"

const Header = () => {
    const { data: session, status } = useSession();

    console.log("session: ", session)

    return (
        <header className="w-full border-b">
            <div className="h-[55px] max-w-screen-lg mx-auto flex items-center justify-between">
                <span>Smart Contract</span>
                {
                    status === "authenticated" && (
                        <button className="bg-red-500 rounded-md px-2 py-1 text-white" onClick={() => {
                            signOut({ callbackUrl: "/" });
                        }}>Đăng xuất</button>
                    )
                }
            </div>
        </header>
    )
}

export default Header;