"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export const LogoutButton = () => {
    const router = useRouter();

    const handleLogout = async () => {
        await authClient.signOut();
        router.push("/");
    };

    return (
        <Button onClick={handleLogout}>
            Log Out
        </Button>
    );
};