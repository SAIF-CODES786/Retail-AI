
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    shopName: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await api.post("/auth/register", formData);

      setSuccess(response.data.message);

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    }  catch (err) {
  console.error("Registration error:", err);

  setError(
    err.response?.data?.error ||
    err.response?.data?.message ||
    err.message ||
    "Registration failed"
  );
} finally {
  setLoading(false);
}
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Create Account</h1>
        <p>Set up your Retail AI shop account</p>

        {error && <div className="error-message">{error}</div>}

        {success && (
          <div className="success-message">{success}</div>
        )}

        <label htmlFor="name">Full Name</label>
        <input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter your full name"
          required
        />

        <label htmlFor="shopName">Shop Name</label>
        <input
          id="shopName"
          name="shopName"
          value={formData.shopName}
          onChange={handleChange}
          placeholder="Enter your shop name"
          required
        />

        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@example.com"
          required
        />

        <label htmlFor="phone">Phone Number</label>
        <input
          id="phone"
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Enter your phone number"
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Create a password"
          minLength={8}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        <p className="auth-footer">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
