import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../App.css";


const initialForm = {
  date: new Date().toISOString().split("T")[0],
  product: "",
  supplier: "",
  quantity: "1",
  purchasePrice: "",
};

export default function Purchases() {
  const navigate = useNavigate();

  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = async () => {
    try {
       const [purchaseRes, supplierRes, productRes] = await Promise.all([
  api.get("/purchases"),
  api.get("/suppliers"),
  api.get("/products"),
]); 

      setPurchases(
        purchaseRes.data.purchases ||
        purchaseRes.data ||
        []
      );

      setSuppliers(
        supplierRes.data.suppliers ||
        supplierRes.data ||
        []
      );


      setProducts(
  productRes.data.products ||
  productRes.data ||
  []
);

      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Purchases load nahi ho paaye."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

   const quantity = Number(form.quantity);
   const purchasePrice = Number(form.purchasePrice);
   const totalCost = quantity * purchasePrice;

    if (!form.supplier) {
      setError("Supplier select karo.");
      return;
    }
    

    if (!Number.isInteger(quantity) || quantity < 1) {
  setError("Quantity kam se kam 1 honi chahiye.");
  return;
}
if (!Number.isFinite(purchasePrice) || purchasePrice < 0) {
  setError("Purchase price zero ya positive hona chahiye.");
  return;
}

    
const payload = {
  date: form.date,
  product: form.product,
  supplier: form.supplier,
  quantity,
  purchasePrice,
  totalCost,
};


    try {
      if (editingId) {
        await api.put(`/purchases/${editingId}`, payload);
        setMessage("Purchase updated successfully.");
      } else {
        await api.post("/purchases", payload);
        setMessage("Purchase added successfully.");
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Purchase save nahi ho paayi."
      );
    }
  };

  
const handleEdit = (purchase) => {
  setEditingId(purchase._id);

  setForm({
    date: purchase.date
      ? new Date(purchase.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    product: purchase.product?._id || purchase.product || "",
    supplier: purchase.supplier?._id || purchase.supplier || "",
    quantity: String(purchase.quantity ?? 1),
    purchasePrice: String(purchase.purchasePrice ?? ""),
  });

  setError("");
  setMessage("");
  window.scrollTo({ top: 0, behavior: "smooth" });
};


  const handleDelete = async (id) => {
    if (!window.confirm("Kya tum ye purchase delete karna chahte ho?")) {
      return;
    }

    try {
      await api.delete(`/purchases/${id}`);
      setMessage("Purchase deleted successfully.");

      if (editingId === id) {
        resetForm();
      }

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Purchase delete nahi ho paayi."
      );
    }
  };

  return (
    <main className="products-page">
      <header className="products-header">
        <div>
          <h1>Purchase Management</h1>
          <p>Manage supplier purchases and purchase amounts.</p>
        </div>

        <button
          type="button"
          className="secondary-btn"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </header>

      {error && <p className="products-error">{error}</p>}
      {message && <p className="sales-success">{message}</p>}

      <section className="product-form-card">
        <h2>{editingId ? "Edit Purchase" : "Add New Purchase"}</h2>

        {suppliers.length === 0 ? (
          <p>
            Pehle Supplier Management page par ek supplier add karo.
          </p>
        ) : (
          <form className="product-form" onSubmit={handleSubmit}>
             
<label>
  Purchase Date *
  <input
    type="date"
    name="date"
    value={form.date}
    onChange={handleChange}
    required
  />
</label>

<label>
  Product *
  <select
    name="product"
    value={form.product}
    onChange={handleChange}
    required
  >
    <option value="">Select product</option>
    {products.map((product) => (
      <option key={product._id} value={product._id}>
        {product.name}
      </option>
    ))}
  </select>
</label>

<label>
  Supplier *
  <select
    name="supplier"
    value={form.supplier}
    onChange={handleChange}
    required
  >
    <option value="">Select supplier</option>
    {suppliers.map((supplier) => (
      <option key={supplier._id} value={supplier._id}>
        {supplier.name}
      </option>
    ))}
  </select>
</label>

<label>
  Quantity *
  <input
    type="number"
    name="quantity"
    min="1"
    step="1"
    value={form.quantity}
    onChange={handleChange}
    required
  />
</label>

<label>
  Purchase Price per Unit (₹) *
  <input
    type="number"
    name="purchasePrice"
    min="0"
    step="0.01"
    value={form.purchasePrice}
    onChange={handleChange}
    required
  />
</label>

<p>
  Total Cost: ₹
  {(Number(form.quantity || 0) * Number(form.purchasePrice || 0)).toLocaleString("en-IN")}
</p>


            <div className="product-form-actions">
              <button type="submit" className="primary-btn">
                {editingId ? "Update Purchase" : "Add Purchase"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </section>

      <section className="products-list-card">
        <h2>All Purchases ({purchases.length})</h2>

        {loading ? (
          <p>Loading purchases...</p>
        ) : purchases.length === 0 ? (
          <p>No purchases added yet.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                 
<tr>
  <th>Date</th>
  <th>Product</th>
  <th>Supplier</th>
  <th>Quantity</th>
  <th>Purchase Price</th>
  <th>Total Cost</th>
  <th>Actions</th>
</tr>

              </thead>

              
                
<tbody>
  {purchases.map((purchase) => (
    <tr key={purchase._id}>
      <td>
        {purchase.date
          ? new Date(purchase.date).toLocaleDateString("en-IN")
          : "—"}
      </td>

      <td>
        {purchase.product?.name || "Product"}
      </td>

      <td>
        {purchase.supplier?.name || "Supplier"}
      </td>

      <td>{purchase.quantity}</td>

      <td>
        ₹{Number(purchase.purchasePrice ?? 0).toLocaleString("en-IN")}
      </td>

      <td>
        ₹{Number(purchase.totalCost ?? 0).toLocaleString("en-IN")}
      </td>

      <td>
        <div className="product-actions">
          <button
            type="button"
            className="edit-btn"
            onClick={() => handleEdit(purchase)}
          >
            Edit
          </button>

          <button
            type="button"
            className="delete-btn"
            onClick={() => handleDelete(purchase._id)}
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