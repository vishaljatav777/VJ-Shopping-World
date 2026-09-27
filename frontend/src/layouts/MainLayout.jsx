import { useState } from "react"
import Header from "../components/layout/Header"

function MainLayout({ children }) {
  const [search, setSearch] = useState("")

  return (
    <div className="min-h-screen">
      <Header search={search} setSearch={setSearch} />

      <main>
        {children}
      </main>
    </div>
  )
}

export default MainLayout