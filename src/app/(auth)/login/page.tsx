"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, Input, Button } from "@/components/ui";
import { loginSchema, type LoginInput } from "@/lib/validations";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<LoginInput>({ phone: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    setErrors({});

    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        phone: form.phone,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setApiError("No. HP atau password salah");
      } else if (result?.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setApiError("Terjadi kesalahan, coba lagi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="text-center mb-2">
          <h1 className="text-3xl font-bold text-blue-600">Pundira</h1>
          <p className="text-sm text-gray-500 mt-1">Pundi + Mitra</p>
        </div>
        <CardTitle className="text-center">Masuk ke Akun</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {apiError}
            </div>
          )}

          <Input
            id="phone"
            label="No. HP"
            type="text"
            placeholder="08xxxxxxxxxx"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            error={errors.phone}
          />

          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="Masukkan password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={errors.password}
          />

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Masuk
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
