type ButtonProps = {
    children: React.ReactNode
    type?: 'button' | 'submit' | 'reset'
}

export default function ButtonBlack({ children, type = 'button' }: ButtonProps) {
    return (
        <button
            type={type}
            className="w-full rounded-xl bg-black p-3 text-sm font-medium text-white transition-all hover:opacity-80 active:opacity-70"
        >
            {children}
        </button>
    )
}
