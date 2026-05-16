'use client'

import { useState } from "react";
import ButtonBlack from "../components/ui/buttonBlack";
import ButtonWhite from "../components/ui/buttonWhite";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')

    return (
        <main className="flex min-h-screen items-center justify-center bg-sky-50 px-4">
            <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-sm">

                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-semibold text-gray-900">Recuperar senha</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Informe seu e-mail e enviaremos um link para redefinir sua senha
                    </p>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">E-mail</label>
                        <input
                            className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none transition focus:border-black"
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <ButtonBlack type="submit">Enviar link de recuperação</ButtonBlack>

                    <div className="relative my-1">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-100" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white px-3 text-xs text-gray-400">ou</span>
                        </div>
                    </div>

                    <Link href="/login">
                        <ButtonWhite>Voltar ao login</ButtonWhite>
                    </Link>
                </div>
            </div>
        </main>
    );
}
