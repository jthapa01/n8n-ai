import { LoginForm } from "@/features/auth/components/login-form";
import { requireUnauth } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

const Page = async () => {
  await requireUnauth();

  return <LoginForm />;
};

export default Page;