import { useAuth } from "../context/AuthContext";

function Home() {
    const { user, profile, role, loading, signOut } = useAuth();

    if (loading) {
        return <p>Loading account...</p>;
    }

    const handleLogout = async () => {
        await signOut();
    };

    return (
        <div>
            <h1>SeeMenu</h1>

            {user ? (
                <div>
                    <p>You are logged in.</p>
                    <p>Email: {user.email}</p>

                    {profile ? (
                        <div>
                            <p>Username: {profile.username}</p>
                            <p>Phone: {profile.phone || "Not provided"}</p>
                            <p>Role: {role}</p>
                        </div>
                    ) : (
                        <p>Could not load your SeeMenu profile.</p>
                    )}

                    <button onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            ) : (
                <p>You are not logged in.</p>
            )}
        </div>
    );
}

export default Home;