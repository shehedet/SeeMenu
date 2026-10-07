import { useState } from "react";
import { supabase } from "./lib/supabase";

function App() {
    const [message, setMessage] = useState("");

    const testSignup = async () => {
        const email = "test@seemenu.com";
        const password = "TestPassword123!";
        const username = "testuser";
        const phone = "01700000000";

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username,
                    phone
                }
            }
        });

        if (error) {
            console.error(error);
            setMessage(`Error: ${error.message}`);
            return;
        }

        console.log("Signup result:", data);
        setMessage("Signup successful. Check Supabase.");
    };

    return (
        <div>
            <h1>SeeMenu</h1>

            <button onClick={testSignup}>
                Test Signup
            </button>

            <p>{message}</p>
        </div>
    );
}

export default App;