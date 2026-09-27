import { useState } from "react"
import HeroSection from "../components/common/HeroSection"
import CategorySection from "../components/product/CategorySection"
import ProductGrid from "../components/product/ProductGrid"

function Home() {
  const [search, setSearch] = useState("")

  return (
    <div>
      <HeroSection />
      <CategorySection />
      <ProductGrid search={search} />
    </div>
  )
}

export default Home