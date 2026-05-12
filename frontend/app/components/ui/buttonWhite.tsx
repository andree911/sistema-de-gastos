type ButtonProps = {
    children: React.ReactNode
}

export default function ButtonWhite({ children }: ButtonProps) {
    return (
        <button className="
        mx-auto
        block
        w-60
        rounded-xl
        bg-white
        p-4
        text-base
        text-black
        transition-all
        hover:opacity-80
        active:opacity-50
        "
        >
        {children}
        </button>
    )
}