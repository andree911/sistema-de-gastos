'use client'

import { useState } from "react";
import ButtonBlack from "../components/ui/buttonBlack";
import ButtonWhite from "../components/ui/buttonWhite";
import Link from "next/link";

export default function RegisterPage() {
    const [nome, setNome] = useState('')
    const [email, setEmail] = useState('')
    const [senha, setSenha] = useState('')

    return (
        <main className="flex min-h-screen items-center justify-center bg-sky-50 px-4">
            <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-sm">

                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-semibold text-gray-900">Crie sua conta</h1>
                    <p className="mt-1 text-sm text-gray-500">Comece a agendar em minutos</p>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Nome completo</label>
                        <input
                            className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none transition focus:border-black"
                            type="text"
                            placeholder="Seu nome"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                        />
                    </div>

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

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Senha</label>
                        <input
                            className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none transition focus:border-black"
                            type="password"
                            placeholder="••••••••"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                        />
                    </div>

                    <ButtonBlack type="submit">Criar conta</ButtonBlack>

                    <div className="relative my-1">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-100" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white px-3 text-xs text-gray-400">ou</span>
                        </div>
                    </div>

                    <Link href="/login">
                        <ButtonWhite>Já tenho uma conta</ButtonWhite>
                    </Link>
                </div>
            </div>
        </main>
    );
}
