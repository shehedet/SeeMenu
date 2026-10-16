import { createContext, useContext, useEffect, useState } from "react";

import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);

    const fetchProfile = async (userId) => {
        const { data, error } = await supabase
            .from("profiles")
            .select("id, username, full_name, phone, role, avatar_url")
            .eq("id", userId)
            .single();

        if (error) {
            console.error("Error fetching profile:", error);
            setProfile(null);
            return;
        }

        setProfile(data);
    };


    const refreshProfile = async () => {
        if (!session?.user) return;

        await fetchProfile(session.user.id);
    };


    useEffect(() => {
        let isMounted = true;

        const initializeAuth = async () => {
            const { data, error } = await supabase.auth.getSession();

            if (error) {
                console.error("Error getting session:", error);
            }

            if (!isMounted) return;

            setSession(data.session);

            if (data.session?.user) {
                await fetchProfile(data.session.user.id);
            } else {
                setProfile(null);
            }

            if (isMounted) {
                setLoading(false);
            }
        };

        initializeAuth();

        const {
            data: { subscription }
        } = supabase.auth.onAuthStateChange((event, currentSession) => {
            setSession(currentSession);

            if (event === "SIGNED_OUT" || !currentSession) {
                setProfile(null);
                setLoading(false);
                return;
            }

            if (event === "SIGNED_IN" || event === "USER_UPDATED") {
                setLoading(true);

                // Defer the database request until after the auth callback.
                setTimeout(() => {
                    fetchProfile(currentSession.user.id).finally(() => {
                        setLoading(false);
                    });
                }, 0);
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                session,
                user: session?.user ?? null,
                profile,
                role: profile?.role ?? null,
                loading,
                signOut,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export default AuthContext;