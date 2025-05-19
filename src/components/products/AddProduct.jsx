import React, { useState } from "react";
import {
  Container,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
  InputGroup,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../Header";

const AddProduct = ({ userData, onLogout }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    condition: "new",
    minPurchase: 1,
    brand: "",
    price: "",
    stock: "",
    description: "",
    image: "",
  });
  const [validated, setValidated] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "image" && files.length > 0) {
      setFormData((prev) => ({
        ...prev,
        image: files[0], // Simpan file object, bukan string
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    setValidated(true);
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");

      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("type", formData.type);
      formDataToSend.append("condition", formData.condition);
      formDataToSend.append("minPurchase", parseInt(formData.minPurchase, 10));
      formDataToSend.append("brand", formData.brand);
      formDataToSend.append("stock", parseInt(formData.stock, 10));
      formDataToSend.append("price", parseFloat(formData.price));
      formDataToSend.append("description", formData.description); // atau kalau mau array juga bisa format string-nya
      formDataToSend.append("image", formData.image); // kirim file
      console.log("formDataToSend:", formDataToSend);

      await axios.post("/api/products", formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data", // HARUS multipart kalau upload file
        },
      });

      alert("Product added successfully!");
      navigate("/dashboard/office");
    } catch (err) {
      console.error("Error adding product:", err);
      setError(
        err.response?.data?.error || "Failed to add product. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header userData={userData} onLogout={onLogout} />
      <Container className="py-5">
        <Card className="shadow-sm">
          <Card.Header className="bg-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Add New Product</h5>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => navigate("/dashboard/office")}
              >
                Back to Dashboard
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            {error && (
              <Alert variant="danger" className="mb-4">
                {error}
              </Alert>
            )}

            <Form noValidate validated={validated} onSubmit={handleSubmit}>
              {/* Product Name */}
              <Form.Group className="mb-3">
                <Form.Label>Product Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter product name"
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a product name.
                </Form.Control.Feedback>
              </Form.Group>

              {/* Product Type */}
              <Form.Group className="mb-3">
                <Form.Label>Product Type</Form.Label>
                <Form.Select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select product type</option>
                  <option value="Camera">Camera</option>
                  <option value="Memory Card">Memory Card</option>
                  <option value="Smart Entry">Smart Entry</option>
                  <option value="Storage">Storage</option>
                  <option value="NVR">NVR</option>
                  <option value="Smart Cleaner">Smart Cleaner</option>
                  <option value="Vacuum & Floor Cleaner">
                    Vacuum & Floor Cleaner
                  </option>
                  <option value="Accessories">Accessories</option>
                  <option value="Cable">Cable</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  Please select a product type.
                </Form.Control.Feedback>
              </Form.Group>

              {/* Condition */}
              <Form.Group className="mb-3">
                <Form.Label>Condition</Form.Label>
                <Form.Select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  required
                >
                  <option value="new">New</option>
                  <option value="used">Used</option>
                </Form.Select>
              </Form.Group>

              {/* Min Purchase */}
              <Form.Group className="mb-3">
                <Form.Label>Minimum Purchase Quantity</Form.Label>
                <Form.Control
                  type="number"
                  name="minPurchase"
                  value={formData.minPurchase}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </Form.Group>

              {/* Brand */}
              <Form.Group className="mb-3">
                <Form.Label>Brand</Form.Label>
                <Form.Control
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="Enter brand"
                  required
                />
              </Form.Group>

              {/* Price */}
              <Form.Group className="mb-3">
                <Form.Label>Price (IDR)</Form.Label>
                <InputGroup>
                  <InputGroup.Text>Rp</InputGroup.Text>
                  <Form.Control
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="Enter price"
                    min="0"
                    required
                  />
                </InputGroup>
              </Form.Group>

              {/* Stock */}
              <Form.Group className="mb-3">
                <Form.Label>Stock</Form.Label>
                <Form.Control
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="Enter stock amount"
                  min="0"
                  required
                />
              </Form.Group>

              {/* Description */}
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="E.g: Lightweight, Durable, High quality"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Upload Image</Form.Label>
                <Form.Control
                  type="file"
                  name="image"
                  onChange={handleChange}
                  accept="image/*"
                  required
                />
              </Form.Group>

              {/* Submit Button */}
              <div className="d-grid gap-2">
                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Adding Product...
                    </>
                  ) : (
                    "Add Product"
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </>
  );
};

export default AddProduct;
