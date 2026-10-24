
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Search,
    UtensilsCrossed,
    ChevronDown,
    LogOut,
    LayoutDashboard,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

function Navbar({ searchQuery, onSearchChange }) {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = async () => {
        setLoggingOut(true);

        const { error } = await supabase.auth.signOut();

        setLoggingOut(false);

        if (error) {
            console.error("Logout error:", error);
            return;
        }

        setAccountMenuOpen(false);
        navigate("/");
    };


    const profilePath = profile?.username
        ? `/${
            profile.role === "moderator"
                ? "moderators"
                : profile.role === "admin"
                ? "admins"
                : "contributors"
            }/${encodeURIComponent(profile.username)}`
        : null;


    return (
        <header className="sticky top-0 z-50 border-b-2 border-ink bg-paper">
            <nav className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-4 sm:px-6 lg:flex-nowrap lg:px-8">
                <Link
                    to="/"
                    className="flex shrink-0 items-center gap-2"
                    aria-label="SeeMenu homepage"
                >
                    <span className="flex h-10 w-10 items-center justify-center border-2 border-ink bg-mint">
                        <UtensilsCrossed size={21} />
                    </span>

                    <span className="text-xl font-extrabold tracking-tight">
                        See<span className="font-normal">Menu</span>
                    </span>
                </Link>

                <form
                    role="search"
                    className="order-3 flex w-full items-center border border-ink bg-white px-3 focus-within:bg-mint/30 lg:order-none lg:ml-auto lg:max-w-lg"
                    onSubmit={(event) => event.preventDefault()}
                >
                    <Search size={18} className="shrink-0" />

                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(event) =>
                            onSearchChange(event.target.value)
                        }
                        placeholder="Restaurant, food, or area..."
                        aria-label="Search restaurants, food, or areas"
                        className="w-full min-w-0 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted"
                    />
                </form>

                <div className="ml-auto flex shrink-0 items-center gap-3 lg:ml-4">
                    {user ? (
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() =>
                                    setAccountMenuOpen((open) => !open)
                                }
                                aria-expanded={accountMenuOpen}
                                aria-haspopup="true"
                                className="flex max-w-48 items-center gap-2 border border-ink bg-paper px-3 py-2 text-sm font-semibold hover:bg-mint sm:max-w-56"
                            >
                                <span className="max-w-36 truncate">
                                    {profile?.username || user.email}
                                </span>
                                <ChevronDown size={16} className="shrink-0" />
                            </button>

                            {accountMenuOpen && (
                                <div className="absolute right-0 top-full z-30 mt-2 w-64 border-2 border-ink bg-paper">
                                    {profilePath && (
                                        <Link
                                            to={profilePath}
                                            onClick={() => setAccountMenuOpen(false)}
                                            className="block w-full border-b border-line px-4 py-3 text-left text-sm hover:bg-mint"
                                        >
                                            <p className="font-bold">{profile.username}</p>
                                            <p className="mt-1 break-all text-xs text-muted">{user.email}</p>
                                            <p className="mt-1 text-xs text-muted">
                                            {profile.role === "admin"
                                                ? "Admin"
                                                : profile.role === "moderator"
                                                ? "Moderator"
                                                : "Contributor"}
                                            </p>
                                        </Link>
                                        )}


                                    
                                    {["moderator", "admin"].includes(profile?.role) && (
                                        <Link
                                            to={
                                                profile.role === "admin"
                                                    ? "/admin-test"
                                                    : "/moderator-test"
                                            }
                                            onClick={() => setAccountMenuOpen(false)}
                                            className="flex w-full items-center gap-2 border-b border-line px-4 py-3 text-left text-sm font-semibold hover:bg-mint"
                                        >
                                            <LayoutDashboard size={16} />
                                            Dashboard
                                        </Link>
                                    )}



                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        disabled={loggingOut}
                                        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold hover:bg-pink disabled:opacity-60"
                                    >
                                        <LogOut size={16} />
                                        {loggingOut ? "Logging out..." : "Log out"}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="px-2 py-2 text-sm font-semibold underline-offset-4 hover:underline"
                            >
                                Log in
                            </Link>

                            <Link
                                to="/signup"
                                className="border-2 border-ink bg-mint px-3 py-2 text-sm font-semibold hover:bg-teal"
                            >
                                Sign up
                            </Link>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
}

export default Navbar;