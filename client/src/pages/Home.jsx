import { useAuth } from "../context/AuthContext";

function Home() {
    const { user, loading, signOut } = useAuth();

    if (loading) {
        return <p>Loading...</p>;
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

                    <button onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            ) : (
                <div>
                    <p>You are not logged in.</p>
                </div>
            )}
        </div>
    );
}

export default Home;