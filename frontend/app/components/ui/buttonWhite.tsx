type ButtonProps = {
    children: React.ReactNode
    type?: 'button' | 'submit' | 'reset'
}

export default function ButtonWhite({ children, type = 'button' }: ButtonProps) {
    return (
        <button
            type={type}
            className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 active:bg-gray-100"
        >
            {children}
        </button>
    )
}
