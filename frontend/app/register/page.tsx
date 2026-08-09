'use client'

import { useState } from "react";
import ButtonBlack from "../components/ui/buttonBlack";
import ButtonWhite from "../components/ui/buttonWhite";
import Link from "next/link";

export default function RegisterPage() {
    const [nome, setNome] = useState('')
    const [email, setEmail] = useState('')
    const [senha, setSenha] = useState('')
    const [mostrarSenha, setMostrarSenha] = useState(false)

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
                            className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-900 outline-none transition focus:border-black"
                            type="text"
                            placeholder="Seu nome"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">E-mail</label>
                        <input
                            className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-900 outline-none transition focus:border-black"
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Senha</label>
                        <div className="relative">
                            <input
                                className="w-full rounded-xl border border-gray-200 p-3 pr-10 text-sm text-gray-900 outline-none transition focus:border-black"
                                type={mostrarSenha ? "text" : "password"}
                                placeholder="••••••••"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setMostrarSenha(!mostrarSenha)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {mostrarSenha ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                                        <line x1="1" y1="1" x2="23" y2="23"/>
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                        <circle cx="12" cy="12" r="3"/>
                                    </svg>
                                )}
                            </button>
                        </div>
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
