function Button({ children, className = "" }) {
  return (
    <button
      className={`rounded-lg bg-black px-4 py-2 text-white ${className}`}
    >
      {children}
    </button>
  )
}

export default Button