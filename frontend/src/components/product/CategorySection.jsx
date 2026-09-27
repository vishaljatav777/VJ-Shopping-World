import categories from "../../data/categories";

function CategorySection() {
  return (
    <section className="px-8 py-12">
      <h2 className="text-3xl font-bold">Shop by Category</h2>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {categories.map((category) => (
          <div key={category.id} className="rounded-lg border p-6 text-center">
            {category.name}
          </div>
        ))}
      </div>
    </section>
  );
}

export default CategorySection;
