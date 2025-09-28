"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { FormField, FormInput } from "@/components/ui/form-field";
import { login } from "@/lib/auth";
import { toast } from "sonner";

interface LoginFormProps {
    onLogin: (user: any) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
    const [username, setUsername] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const validateForm = () => {
        if (!username.trim()) {
            setError("Username wajib diisi");
            return false;
        }
        if (username.trim().length < 3) {
            setError("Username minimal 3 karakter");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            // Simulate loading for better UX
            await new Promise((resolve) => setTimeout(resolve, 800));

            // Login Supabase (async)
            const user = await login(username.trim());
            if (user) {
                toast.success(`Selamat datang, ${user.name}!`);
                onLogin(user);
            } else {
                setError("Username tidak ditemukan. Silakan coba lagi.");
                toast.error("Login gagal");
            }
        } catch (error) {
            setError("Terjadi kesalahan. Silakan coba lagi.");
            toast.error("Terjadi kesalahan sistem");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rayo-light to-white p-4">
            <Card className="w-full max-w-md shadow-xl border-0">
                <CardHeader className="text-center pb-8">
                    <div className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6">
                        <img
                            src="/rayo-logo.png"
                            alt="Rayo Kurir Logo"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <CardTitle className="text-3xl font-bold text-rayo-dark">
                        Rayo Kurir
                    </CardTitle>
                    <CardDescription className="text-base">
                        Masuk ke dashboard
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <FormField label="Username" required error={error}>
                            <FormInput
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    setError("");
                                }}
                                placeholder="Masukkan username"
                                disabled={isLoading}
                                error={error}
                                className="h-12"
                            />
                        </FormField>

                        <Button
                            type="submit"
                            disabled={isLoading || !username.trim()}
                            className="w-full h-12 bg-rayo-primary hover:bg-rayo-dark transition-all duration-200 font-medium"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <LoadingSpinner size="sm" />
                                    <span>Memproses...</span>
                                </div>
                            ) : (
                                "Masuk"
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                        <p className="font-medium mb-3 text-gray-700">
                            Demo Accounts:
                        </p>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Admin:</span>
                                <code className="bg-white px-2 py-1 rounded text-rayo-primary font-mono">
                                    admin
                                </code>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Kurir:</span>
                                <code className="bg-white px-2 py-1 rounded text-rayo-primary font-mono">
                                    kurir1, kurir2
                                </code>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
