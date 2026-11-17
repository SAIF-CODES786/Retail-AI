import { useEffect, useState } from "react";
import api from "../services/api";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [outlets, setOutlets] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const initialForm = {
    productId: "",
    name: "",
    category: "",
    itemType: "",
    outlet: "",
    supplier: "",
    unit: "pcs",
    brand: "",
    sellingPrice: "",
    purchasePrice: "",
    minimumStock: 0,
    maximumStock: 0,
    leadTime: 0,
    itemWeight: "",
itemFatContent: "",
itemVisibility: "",
itemMRP: "",
  };

  const [form, setForm] = useState(initialForm);

  const loadProducts = async () => {
    try {
      const response = await api.get("/products");
      setProducts(
        Array.isArray(response.data)
          ? response.data
          : response.data.products || []
      );
      const outletResponse = await api.get("/outlets");
      

setOutlets(
  Array.isArray(outletResponse.data)
    ? outletResponse.data
    : outletResponse.data.outlets || []
);
const supplierResponse = await api.get("/suppliers");

setSuppliers(
  Array.isArray(supplierResponse.data)
    ? supplierResponse.data
    : supplierResponse.data.suppliers || []
);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message || "Products load nahi ho paaye."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...form,
        itemWeight: form.itemWeight === "" ? undefined : Number(form.itemWeight),
itemVisibility: form.itemVisibility === "" ? undefined : Number(form.itemVisibility),
itemMRP: form.itemMRP === "" ? undefined : Number(form.itemMRP),
        sellingPrice: Number(form.sellingPrice),
        purchasePrice: Number(form.purchasePrice),
        minimumStock: Number(form.minimumStock),
        maximumStock: Number(form.maximumStock),
        leadTime: Number(form.leadTime),
      };

      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
      } else {
        await api.post("/products", payload);
      }

      setForm(initialForm);
      setEditingId(null);
      setError("");
      await loadProducts();
    } catch (err) {
      setError(
        err.response?.data?.message || "Product save nahi ho paaya."
      );
    }
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    setForm({
      productId: product.productId || "",
      name: product.name || "",
      category: product.category || "",
      itemType: product.itemType || "",
      outlet: product.outlet?._id || product.outlet || "",
      supplier: product.supplier?._id || product.supplier || "",
      itemWeight: product.itemWeight ?? "",
itemFatContent: product.itemFatContent || "",
itemVisibility: product.itemVisibility ?? "",
itemMRP: product.itemMRP ?? "",
      unit: product.unit || "pcs",
      brand: product.brand || "",
      sellingPrice: product.sellingPrice ?? "",
      purchasePrice: product.purchasePrice ?? "",
      minimumStock: product.minimumStock ?? 0,
      maximumStock: product.maximumStock ?? 0,
      leadTime: product.leadTime ?? 0,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Kya tum ye product delete karna chahte ho?")) {
      return;
    }

    try {
      await api.delete(`/products/${id}`);
      await loadProducts();
    } catch (err) {
      setError(
        err.response?.data?.message || "Product delete nahi ho paaya."
      );
    }
  };

  return (
    <main className="products-page">
      <header className="products-header">
        <div>
          <h1>Product Management</h1>
          <p>Apne store ke products manage karo.</p>
        </div>

        <button
          type="button"
          className="secondary-btn"
          onClick={() => (window.location.href = "/dashboard")}
        >
          Back to Dashboard
        </button>
      </header>

      {error && <p className="products-error">{error}</p>}

      <section className="product-form-card">
        <h2>{editingId ? "Edit Product" : "Add New Product"}</h2>

        <form className="product-form" onSubmit={handleSubmit}>
          <label>
            Product ID *
            <input
              name="productId"
              value={form.productId}
              onChange={handleChange}
              required
              disabled={Boolean(editingId)}
              placeholder="e.g. P001"
            />
          </label>

          <label>
            Product Name *
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="e.g. Tata Salt"
            />
          </label>

          <label>
            Category *
            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              placeholder="e.g. Grocery"
            />
          </label>

          <label>
  Select Outlet *
  <select
    name="outlet"
    value={form.outlet}
    onChange={handleChange}
    required
  >
    <option value="">Choose Outlet</option>

    {outlets.map((outlet) => (
      <option key={outlet._id} value={outlet._id}>
        {outlet.outletIdentifier}
      </option>
    ))}
  </select>
</label>

<label>
  Select Supplier
  <select
    name="supplier"
    value={form.supplier}
    onChange={handleChange}
  >
    <option value="">Choose Supplier</option>

    {suppliers.map((supplier) => (
      <option key={supplier._id} value={supplier._id}>
        {supplier.name}
      </option>
    ))}
  </select>
</label>


<label>
  Item Weight (kg)
  <input
    name="itemWeight"
    type="number"
    min="0"
    step="0.01"
    value={form.itemWeight}
    onChange={handleChange}
    placeholder="e.g. 9.3"
  />
</label>


<label>
  Item Fat Content
  <select
    name="itemFatContent"
    value={form.itemFatContent}
    onChange={handleChange}
  >
    <option value="">Select Fat Content</option>
    <option value="Low Fat">Low Fat</option>
    <option value="Regular">Regular</option>
  </select>
</label>



<label>
  Item Type
  <select
    name="itemType"
    value={form.itemType}
    onChange={handleChange}
  >
    <option value="">Select Item Type</option>
    <option value="Baking Goods">Baking Goods</option>
    <option value="Breads">Breads</option>
    <option value="Breakfast">Breakfast</option>
    <option value="Canned">Canned</option>
    <option value="Dairy">Dairy</option>
    <option value="Frozen Foods">Frozen Foods</option>
    <option value="Fruits and Vegetables">Fruits and Vegetables</option>
    <option value="Hard Drinks">Hard Drinks</option>
    <option value="Health and Hygiene">Health and Hygiene</option>
    <option value="Household">Household</option>
    <option value="Meat">Meat</option>
    <option value="Others">Others</option>
    <option value="Seafood">Seafood</option>
    <option value="Snack Foods">Snack Foods</option>
    <option value="Soft Drinks">Soft Drinks</option>
    <option value="Starchy Foods">Starchy Foods</option>
  </select>
</label>


<label>
  Item Visibility
  <input
    name="itemVisibility"
    type="number"
    min="0"
    step="0.000001"
    value={form.itemVisibility}
    onChange={handleChange}
    placeholder="e.g. 0.016047"
  />
</label>


<label>
  Item MRP (₹)
  <input
    name="itemMRP"
    type="number"
    min="0"
    step="0.01"
    value={form.itemMRP}
    onChange={handleChange}
    placeholder="e.g. 249.81"
  />
</label>

          <label>
            Unit *
            <input
              name="unit"
              value={form.unit}
              onChange={handleChange}
              required
              placeholder="pcs, kg, packet"
            />
          </label>

          <label>
            Brand
            <input
              name="brand"
              value={form.brand}
              onChange={handleChange}
              placeholder="Brand name"
            />
          </label>

          <label>
            Selling Price (₹) *
            <input
              name="sellingPrice"
              type="number"
              min="0"
              step="0.01"
              value={form.sellingPrice}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Purchase Price (₹) *
            <input
              name="purchasePrice"
              type="number"
              min="0"
              step="0.01"
              value={form.purchasePrice}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Minimum Stock
            <input
              name="minimumStock"
              type="number"
              min="0"
              value={form.minimumStock}
              onChange={handleChange}
            />
          </label>

          <label>
            Maximum Stock
            <input
              name="maximumStock"
              type="number"
              min="0"
              value={form.maximumStock}
              onChange={handleChange}
            />
          </label>

          <label>
            Supplier Lead Time (days)
            <input
              name="leadTime"
              type="number"
              min="0"
              value={form.leadTime}
              onChange={handleChange}
            />
          </label>

          <div className="product-form-actions">
            <button type="submit" className="primary-btn">
              {editingId ? "Update Product" : "Add Product"}
            </button>

            {editingId && (
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setForm(initialForm);
                  setEditingId(null);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="products-list-card">
        <h2>All Products ({products.length})</h2>

        {loading ? (
          <p>Loading products...</p>
        ) : products.length === 0 ? (
          <p>No products added yet.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Selling Price</th>
                  <th>Purchase Price</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td>{product.productId}</td>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>{product.unit}</td>
                    <td>₹{product.sellingPrice}</td>
                    <td>₹{product.purchasePrice}</td>
                    <td>
                      <div className="product-actions">
                        <button
                          type="button"
                          className="edit-btn"
                          onClick={() => handleEdit(product)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => handleDelete(product._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
