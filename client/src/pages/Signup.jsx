
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { supabase } from "../lib/supabase";

function Signup() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("error");
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage("");

        if (formData.password !== formData.confirmPassword) {
            setMessage("Passwords do not match.");
            setMessageType("error");
            return;
        }

        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signUp({
                email: formData.email.trim(),
                password: formData.password,
                options: {
                    emailRedirectTo: window.location.origin,
                    data: {
                        username: formData.username.trim(),
                        phone: formData.phone.trim(),
                    },
                },
            });

            if (error) {
                setMessage(error.message);
                setMessageType("error");
                return;
            }

            if (data.session) {
                navigate("/");
                return;
            }

            setMessage(
                "Account created. Check your email for a confirmation link if required before logging in."
            );
            setMessageType("success");
        } catch (error) {
            setMessage(error.message || "Signup failed. Please try again.");
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    
    const handleGoogleSignup = async () => {
        setMessage("");
        setLoading(true);

        try {            
                const redirectUrl = import.meta.env.DEV
                ? window.location.origin
                : "https://see-menu.vercel.app";

                const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: redirectUrl,
                },
            });

            if (error) {
                setMessage(error.message);
                setMessageType("error");
                setLoading(false);
            }
            // Supabase redirects to Google when OAuth starts successfully.
        } catch (error) {
            setMessage(error.message || "Google sign-up failed. Please try again.");
            setMessageType("error");
            setLoading(false);
        }
    };

    const inputClass =
        "w-full border border-ink bg-white px-3 py-3 text-sm outline-none focus:border-2 focus:bg-mint/20";

    return (
        <main className="min-h-[calc(100vh-73px)] bg-paper px-4 py-10 sm:py-16">
            <div className="mx-auto w-full max-w-md">
                <Link
                    to="/"
                    className="mb-10 inline-flex items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline"
                >
                    <ArrowLeft size={16} />
                    Back to SeeMenu
                </Link>

                <div className="mb-8 border-b-2 border-ink pb-6">
                    <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-muted">
                        Join the community
                    </p>
                    <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                        Create an account
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-muted">
                        Help others find menus and discover places to eat.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label
                            htmlFor="username"
                            className="mb-2 block text-sm font-semibold"
                        >
                            Username
                        </label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            autoComplete="username"
                            minLength={3}
                            maxLength={30}
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Choose a username"
                            className={inputClass}
                            required
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="email"
                            className="mb-2 block text-sm font-semibold"
                        >
                            Email address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            className={inputClass}
                            required
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="phone"
                            className="mb-2 block text-sm font-semibold"
                        >
                            Phone number
                        </label>
                        <input
                            id="phone"
                            name="phone"
                            type="tel"
                            autoComplete="tel"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Your contact number"
                            className={inputClass}
                            required
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="mb-2 block text-sm font-semibold"
                        >
                            Password
                        </label>
                        <div className="flex border border-ink bg-white focus-within:border-2">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Create a password"
                                className="w-full min-w-0 bg-transparent px-3 py-3 text-sm outline-none"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((value) => !value)}
                                className="shrink-0 px-3 hover:bg-mint/40"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="confirmPassword"
                            className="mb-2 block text-sm font-semibold"
                        >
                            Confirm password
                        </label>
                        <div className="flex border border-ink bg-white focus-within:border-2">
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                autoComplete="new-password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Enter the password again"
                                className="w-full min-w-0 bg-transparent px-3 py-3 text-sm outline-none"
                                required
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    setShowConfirmPassword((value) => !value)
                                }
                                className="shrink-0 px-3 hover:bg-mint/40"
                                aria-label={
                                    showConfirmPassword
                                        ? "Hide confirm password"
                                        : "Show confirm password"
                                }
                            >
                                {showConfirmPassword ? (
                                    <EyeOff size={18} />
                                ) : (
                                    <Eye size={18} />
                                )}
                            </button>
                        </div>
                    </div>

                    {message && (
                        <p
                            role={messageType === "error" ? "alert" : "status"}
                            className={`border-l-4 px-3 py-3 text-sm ${
                                messageType === "error"
                                    ? "border-pink bg-pink/40"
                                    : "border-teal bg-mint/40"
                            }`}
                        >
                            {message}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full border-2 border-ink bg-mint px-4 py-3 text-sm font-bold transition-colors hover:bg-teal disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Creating account..." : "Create account"}
                    </button>
                </form>

                
                <div className="mt-5 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-line" />
                        <span className="text-xs font-semibold uppercase text-muted">
                            or
                        </span>
                        <div className="h-px flex-1 bg-line" />
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleSignup}
                        disabled={loading}
                        className="w-full border-2 border-ink bg-paper px-4 py-3 text-sm font-bold transition-colors hover:bg-pink disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Continue with Google
                    </button>
                </div>

                <p className="mt-8 text-center text-sm text-muted">
                    Already have an account?{" "}
                    <Link
                        to="/login"
                        className="font-bold text-ink underline underline-offset-4"
                    >
                        Log in
                    </Link>
                </p>
            </div>
        </main>
    );
}

export default Signup;