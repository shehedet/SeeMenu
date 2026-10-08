import { useState } from "react";
import { supabase } from "../lib/supabase";

function Login() {
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setMessage("");
        setLoading(true);

        const { data, error } =
            await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password
            });

        setLoading(false);

        if (error) {
            console.error(error);
            setMessage(error.message);
            return;
        }

        console.log("Login result:", data);
        setMessage("Login successful.");
    };

    return (
        <div>
            <h1>Login</h1>

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email">Email</label>

                    <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="password">Password</label>

                    <input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>

            {message && <p>{message}</p>}
        </div>
    );
}

export default Login;