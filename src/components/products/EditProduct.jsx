import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
  InputGroup,
} from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import Header from "../Header";

const EditProduct = ({ userData, onLogout }) => {
  const navigate = useNavigate();
  const [imageLama, setImageLama] = useState(null);
  const { id } = useParams(); // Get product ID from URL
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    price: "",
    stock: 0,
    condition: "new",
    minPurchase: 1,
    brand: "",
    description: "",
    image: null,
  });
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setFetchLoading(true);
        const token = localStorage.getItem("token");

        // First, try to get product data from cookies
        const cookieData = Cookies.get(`product_${id}`);
        if (cookieData) {
          try {
            const parsedData = JSON.parse(cookieData);
            console.log("Found product data in cookies:", parsedData);

            setFormData({
              name: productData.name || "",
              type: productData.type || "",
              price:
                productData.price !== undefined
                  ? productData.price.toString()
                  : "",
              stock:
                productData.stock !== undefined
                  ? productData.stock
                  : "-",
              condition: productData.condition || "new",
              minPurchase:
                productData.minPurchase !== undefined
                  ? productData.minPurchase.toString()
                  : "1",
              brand: productData.brand || "",
              description: productData.description || "",
              image: productData.image || "", // default null saat load, user upload baru bisa ubah
            });

            setImageLama(productData.image);

            setError(null);
            setFetchLoading(false);
            return; // Exit early if we found cookie data
          } catch (err) {
            console.error("Error parsing cookie data:", err);
            // Continue to API fetch if cookie parsing fails
          }
        }

        // If no cookie data, proceed with API fetch
        const response = await axios.get(`/api/products/display/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Product API response:", response.data);

        // Check if response data exists and extract product data
        // Handle both direct object response and array response formats
        const productData = Array.isArray(response.data)
          ? response.data[0]
          : response.data;

        if (productData) {
          console.log("Setting form data with:", productData);

          // Ensure we're converting values to strings for form inputs
          setFormData({
            name: productData.name || "",
            type: productData.type || "",
            price:
              productData.price !== undefined
                ? productData.price.toString()
                : "",
            stock:
              productData.stock !== undefined
                ? productData.stock
                : "-",
            condition: productData.condition || "new",
            minPurchase:
              productData.minPurchase !== undefined
                ? productData.minPurchase.toString()
                : "1",
            brand: productData.brand || "",
            description: productData.description || "",
            image: productData.image || "",
          });

          setImageLama(productData.image);
        } else {
          throw new Error("No product data found");
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching product:", err);

        console.log(userData);

        // Try using data from userData prop as a fallback
        if (userData?._id) {
          console.log("Using product data from props:", userData._id);
          setFormData({
            name: userData.name || "",
            type: userData.type || "",
            price: userData.price?.toString() || "",
            stock: userData.stock || "-",
          });
        } else {
          setError(
            "Failed to load product data. Please go back and try again."
          );
        }
      } finally {
        setFetchLoading(false);
      }
    };

    if (id) {
      fetchProductData();
    }
  }, [id, userData]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    console.log("Form field changed: ", name, value, files);

    if (name === "image" && files.length > 0) {
      setFormData((prev) => ({
        ...prev,
        image: files[0],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle form submission
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
      console.log("Form Data: ", formData);

      console.log("Updated stock:  ", parseInt(formData.stock));

      // Convert string values to appropriate types
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

      console.log("Sending update with data:", formDataToSend);

      // Call the update product API
      await axios.put(`/api/products/${id}`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data", // HARUS multipart kalau upload file
        },
      });

      // Clear the cookie after successful update
      Cookies.remove(`product_${id}`);

      // Show success message and redirect
      alert("Product updated successfully!");
      navigate("/dashboard/office");
    } catch (err) {
      console.error("Error updating product:", err);
      setError(
        err.response?.data?.error ||
          "Failed to update product. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header userData={userData} onLogout={onLogout} />
      <Container className="py-5">
        {fetchLoading ? (
          <div className="text-center">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading product data...</span>
            </Spinner>
            <p className="mt-3">Loading product information...</p>
          </div>
        ) : (
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Edit Product</h5>
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
                  <Form.Control.Feedback type="invalid">
                    Please select product condition.
                  </Form.Control.Feedback>
                </Form.Group>

                {/* Minimum Purchase */}
                <Form.Group className="mb-3">
                  <Form.Label>Minimum Purchase</Form.Label>
                  <Form.Control
                    type="number"
                    name="minPurchase"
                    value={formData.minPurchase}
                    onChange={handleChange}
                    placeholder="Enter minimum purchase"
                    min="1"
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Please enter a valid minimum purchase amount.
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Brand</Form.Label>
                  <Form.Control
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    placeholder="Enter brand name"
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Please enter a brand name.
                  </Form.Control.Feedback>
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
                    <Form.Control.Feedback type="invalid">
                      Please provide a valid price.
                    </Form.Control.Feedback>
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
                    min='0'
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Please provide a valid stock amount.
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter product description"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Product Image</Form.Label>
                  <div>
                    {formData.image ? (
                      <img
                        src={imageLama}
                        alt={formData.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          padding: "10px",
                        }}
                      />
                    ) : (
                      <div className="text-center text-muted">
                        <p>No image available</p>
                      </div>
                    )}
                  </div>
                  <Form.Control
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleChange}
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
                        Updating Product...
                      </>
                    ) : (
                      "Update Product"
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        )}
      </Container>
    </>
  );
};

export default EditProduct;
