type ButtonProps = {
    children: React.ReactNode
}

export default function ButtonBlack({ children }: ButtonProps) {
    return (
        <button className="
        mx-auto
        block
        w-60
        rounded-xl
        bg-black
        p-4
        text-base
        text-white
        transition-all
        hover:opacity-80
        active:opacity-70
        "
        >
        {children}
        </button>
    )
}