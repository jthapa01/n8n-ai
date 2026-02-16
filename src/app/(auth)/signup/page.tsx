import { RegisterForm } from "@/features/auth/components/register-form";
import { requireUnauth } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

const Page = async () => {
    await requireUnauth();
    return <RegisterForm />;
};

export default Page;