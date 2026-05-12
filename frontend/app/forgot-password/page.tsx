'use client'

import Image from "next/image";
import { useState } from "react";
import Button from "../components/ui/buttonBlack";
import ButtonBlack from "../components/ui/buttonBlack";
import ButtonWhite from "../components/ui/buttonWhite";
import Link from "next/link";

export default function LoginPage() {

    const [email, setEmail] = useState('')
    const [senha, setSenha] = useState('')

  return (

    <main className="flex items-center justify-center min-h-screen bg-sky-50">
      <div className="w-full max-w-md min-h-[500px] rounded-3xl p-8 pt-12 shadow bg-white">
        <h2 className="text-center mb-20 text-4xl">Recuperar senha</h2>
        <div className="flex flex-col gap-4 ">
            <div className="flex flex-col gap-1">
            <input className="w-full rounded-lg border-3 p-3 outline-none"
            type="email" 
            placeholder="Seu email aqui"
            value={email}
            onChange={(e) => setEmail(e.target.value)} 
            />
            </div>

            <div>
            <Link href="/login">
            <ButtonWhite>
                Lembrei minha senha
            </ButtonWhite>
            </Link>
            </div>
            <div>
            <ButtonBlack>
                Enviar email
            </ButtonBlack>
            </div>
        </div>
      </div>
    </main>
  );
}
