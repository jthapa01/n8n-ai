"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
    const router = useRouter();

    const form = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const signInGithub = async () => {
        try {
            await authClient.signIn.social({
                provider: "github",
            },
                {
                    onSuccess: () => {
                        router.push("/");
                    },
                    onError: (ctx) => {
                        toast.error(`GitHub Sign-In failed: ${ctx.error.message}`);
                    }
                });
        } catch (error) {
            toast.error(`GitHub Sign-In failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    };

    const signInGoogle = async () => {
        try {
            await authClient.signIn.social({
                provider: "google",
            },
                {
                    onSuccess: () => {
                        router.push("/");
                    }
                    ,
                    onError: (ctx) => {
                        toast.error(`Google Sign-In failed: ${ctx.error.message}`);
                    }
                });
        } catch (error) {
            toast.error(`Google Sign-In failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    };

    const onSubmit = async (data: LoginFormData) => {
        await authClient.signIn.email(
            {
                email: data.email,
                password: data.password,
                callbackURL: "/",
            },
            {
                onSuccess: () => {
                    router.push("/");
                },
                onError: (ctx) => {
                    toast.error(`Email Sign-Up failed: ${ctx.error.message}`);
                }
            }
        );
    };

    const isPending = form.formState.isSubmitting;

    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Sign in to your account</CardTitle>
                    <CardDescription>Enter your credentials to access your account</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                            <div className="grid gap-6">
                                <div className="flex flex-col gap-4">
                                    <Button onClick={signInGithub} variant="outline" className="w-full" type="button" disabled={isPending}>
                                        <Image alt="Github" src="/logos/github.svg" width={20} height={20} />
                                        Continue with Github
                                    </Button>
                                    <Button onClick={signInGoogle} variant="outline" className="w-full" type="button" disabled={isPending}>
                                        <Image alt="Google" src="/logos/google.svg" width={20} height={20} />
                                        Continue with Google
                                    </Button>
                                </div>
                                <div className="grid gap-6">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input type="email" placeholder="Enter your email" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Password</FormLabel>
                                                <FormControl>
                                                    <Input type="password" placeholder="Enter your password" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" className="w-full" disabled={isPending}>
                                        Login
                                    </Button>
                                </div>
                                <div className="text-center text-sm">
                                    Don&apos;t have an account?{" "}
                                    <Link href="/signup" className="underline underline-offset-4">
                                        Register
                                    </Link>
                                </div>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
};