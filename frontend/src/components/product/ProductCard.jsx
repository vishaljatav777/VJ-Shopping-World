import Button from "../common/Button";

function ProductCard({ product }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex h-40 items-center justify-center rounded-lg bg-gray-100">
        <span className="text-gray-400">Product Image</span>
      </div>

      <h3 className="mt-4 text-lg font-semibold">{product.name}</h3>

      <p className="mt-2 text-gray-600">₹{product.price}</p>

      <p className="mt-1 text-sm text-gray-500">{product.category}</p>

      <div className="mt-4">
        <Button className="w-full">Add to Cart</Button>
      </div>
    </div>
  );
}

export default ProductCard;
