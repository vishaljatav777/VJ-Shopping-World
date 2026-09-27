import { useState } from "react"
import products from "../../data/products"
import ProductCard from "./ProductCard"

function ProductGrid() {
  const [search, setSearch] = useState("")

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <section className="px-8 py-12">
      <h2 className="text-3xl font-bold">Popular Products</h2>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
          />
        ))}
      </div>
    </section>
  )
}

export default ProductGrid