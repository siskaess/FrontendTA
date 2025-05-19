import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Badge,
  ListGroup,
  Alert,
} from "react-bootstrap";
import { ArrowLeft, Cart, Check, XCircle } from "react-bootstrap-icons";
import axios from "axios";
import Header from "../Header";
import { useCart } from "../../context/CartContext";

const ProductDetail = ({ userData, onLogout }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addToCart } = useCart();

  // Fetch product details on component mount
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/products/display/${id}`);
        setProduct(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching product details:", err);
        setError(
          err.response?.data?.message || "Failed to load product details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();

    // axios.get(`/api/products/display/${id}`).then((res) => setProduct(res.data));
  }, [id]);

  // Format price in Indonesian Rupiah
  const formatRupiah = (price) => {
    if (price === undefined || price === null) return "Rp N/A";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Handle buy button click
  const handleBuyNow = () => {
    setAddingToCart(true);

    try {
      // Add the product to cart with the selected quantity
      addToCart(product, quantity);

      // Show success message
      setTimeout(() => {
        setAddingToCart(false);
        setAddedToCart(true);

        // Reset success message after 3 seconds
        setTimeout(() => {
          setAddedToCart(false);
        }, 3000);
      }, 800);
    } catch (error) {
      console.error("Error adding to cart:", error);
      setAddingToCart(false);
    }

    // addToCart(product);
    // alert("Product added to cart!");
  };

  // Handle quantity change
  const handleQuantityChange = (newQuantity) => {
    // Ensure quantity is between 1 and available stock
    const maxStock = product?.stock || 1;
    const qty = Math.max(1, Math.min(newQuantity, maxStock));
    setQuantity(qty);
  };

  // Handle back button click
  const handleBack = () => {
    navigate(-1);
  };

  // Function to render description based on its type
  const renderDescription = (description) => {
    if (!description)
      return (
        <p className="text-muted">No description available for this product.</p>
      );

    // Check if description is an array
    if (Array.isArray(description)) {
      return (
        <ul className="ps-3 mb-0">
          {description.map((point, index) => (
            <li key={index} className="mb-2 text-muted">
              {point}
            </li>
          ))}
        </ul>
      );
    }

    // If it's a string but might contain new lines
    if (typeof description === "string" && description.includes("\n")) {
      return description.split("\n").map((line, index) => (
        <p key={index} className="text-muted mb-2">
          {line}
        </p>
      ));
    }

    // Default case: simple string
    return <p className="text-muted">{description}</p>;
  };

  if (loading) {
    return (
      <>
        <Header userData={userData} onLogout={onLogout} />
        <Container className="py-5 text-center">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3">Loading product details...</p>
        </Container>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header userData={userData} onLogout={onLogout} />
        <Container className="py-5">
          <Alert variant="danger">
            <Alert.Heading>Error Loading Product</Alert.Heading>
            <p>{error}</p>
            <hr />
            <div className="d-flex justify-content-between">
              <Button variant="outline-danger" onClick={handleBack}>
                Go Back
              </Button>
              <Button
                variant="outline-primary"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          </Alert>
        </Container>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header userData={userData} onLogout={onLogout} />
        <Container className="py-5">
          <Alert variant="warning">
            <Alert.Heading>Product Not Found</Alert.Heading>
            <p>
              The product you're looking for does not exist or has been removed.
            </p>
            <Button variant="primary" onClick={handleBack} className="mt-3">
              Back to Products
            </Button>
          </Alert>
        </Container>
      </>
    );
  }

  const isOutOfStock = product.stock <= 0;

  return (
    <>
      <Header userData={userData} onLogout={onLogout} />
      <Container className="py-4">
        {/* Back button */}
        <Button
          variant="link"
          className="text-decoration-none mb-4 ps-0"
          onClick={handleBack}
        >
          <ArrowLeft className="me-1" size={18} /> Back to Products
        </Button>

        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            <Row className="g-0">
              {/* Product Image */}
              <Col md={5} className="border-end">
                <div
                  className="d-flex align-items-center justify-content-center bg-light"
                  style={{ height: "400px", padding: "20px" }}
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
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
              </Col>

              {/* Product Details */}
              <Col md={7}>
                <div className="p-4">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h3>{product.name}</h3>
                    {product.type && (
                      <Badge bg="secondary" className="py-1 px-2">
                        {product.type}
                      </Badge>
                    )}
                  </div>

                  <h4 className="text-primary mb-4">
                    {formatRupiah(product.price)}
                  </h4>

                  <div className="mb-4">
                    <div className="d-flex align-items-center mb-3">
                      <div className="me-3">
                        <strong>Availability:</strong>
                      </div>
                      {isOutOfStock ? (
                        <Badge bg="danger" className="py-1 px-2">
                          <XCircle className="me-1" /> Out of Stock
                        </Badge>
                      ) : (
                        <Badge bg="success" className="py-1 px-2">
                          <Check className="me-1" /> In Stock ({product.stock}{" "}
                          available)
                        </Badge>
                      )}
                    </div>

                    {!isOutOfStock && (
                      <div className="d-flex align-items-center mb-4">
                        <div className="me-3">
                          <strong>Quantity:</strong>
                        </div>
                        <div className="d-flex align-items-center">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleQuantityChange(quantity - 1)}
                            disabled={quantity <= 1}
                          >
                            -
                          </Button>
                          <div
                            className="px-3 py-1 mx-2 border rounded"
                            style={{ minWidth: "40px", textAlign: "center" }}
                          >
                            {quantity}
                          </div>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleQuantityChange(quantity + 1)}
                            disabled={quantity >= product.stock}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    )}

                    {!isOutOfStock && (
                      <Button
                        variant="primary"
                        size="lg"
                        className="w-100 mb-3"
                        style={{
                          backgroundColor: "#95b8d1",
                          border: "none",
                        }}
                        onClick={handleBuyNow}
                        disabled={addingToCart}
                      >
                        {addingToCart ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="me-2"
                            />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Cart className="me-2" /> Buy Now
                          </>
                        )}
                      </Button>
                    )}

                    {addedToCart && (
                      <Alert variant="success" className="mt-3">
                        <Check className="me-2" /> Product added to cart
                        successfully!
                      </Alert>
                    )}
                  </div>

                  {/* Product description */}
                  <h5 className="mt-4 mb-3">Description</h5>
                  <div className="mb-4">
                    {renderDescription(product.description)}
                  </div>

                  {/* Additional details */}
                  {(product.features || product.specifications) && (
                    <>
                      <h5 className="mt-4 mb-3">Specifications</h5>
                      <ListGroup variant="flush" className="border-top">
                        {product.features && (
                          <ListGroup.Item className="px-0">
                            <strong>Features:</strong>{" "}
                            {Array.isArray(product.features) ? (
                              <ul className="ps-3 mb-0 mt-2">
                                {product.features.map((feature, index) => (
                                  <li key={index}>{feature}</li>
                                ))}
                              </ul>
                            ) : (
                              product.features
                            )}
                          </ListGroup.Item>
                        )}
                        {product.specifications && (
                          <ListGroup.Item className="px-0">
                            <strong>Technical Specs:</strong>{" "}
                            {Array.isArray(product.specifications) ? (
                              <ul className="ps-3 mb-0 mt-2">
                                {product.specifications.map((spec, index) => (
                                  <li key={index}>{spec}</li>
                                ))}
                              </ul>
                            ) : (
                              product.specifications
                            )}
                          </ListGroup.Item>
                        )}
                        {product.dimensions && (
                          <ListGroup.Item className="px-0">
                            <strong>Dimensions:</strong> {product.dimensions}
                          </ListGroup.Item>
                        )}
                      </ListGroup>
                    </>
                  )}
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Container>

      {/* Footer with Customer Service Info */}
      <footer className="bg-dark text-white py-4 mt-5">
        <Container>
          <Row className="justify-content-between">
            <Col md={4} className="mb-4 mb-md-0">
              <h5 className="mb-3">CV. Matanova Technology Security</h5>
              <p className="text-light mb-0">
                Your trusted partner for high-quality security solutions and
                equipment. Professional service with more than 10 years of
                experience.
              </p>
            </Col>
            <Col md={4} className="mb-4 mb-md-0">
              <h5 className="mb-3">Customer Service</h5>
              <p className="text-light mb-2">
                Need assistance with your purchase?
              </p>
              <p className="mb-1">
                <strong>Phone:</strong>{" "}
                <a
                  href="tel:+6281318996474"
                  className="text-decoration-none text-light"
                >
                  +62 813-1899-6474
                </a>
              </p>
              <p className="text-light small mb-0">
                Operating hours: Monday - Saturday, 09:00 - 17:00
              </p>
            </Col>
          </Row>
          <hr className="my-4 bg-secondary" />
          <div className="text-center text-light small">
            &copy; {new Date().getFullYear()} CV. Matanova Security Technology.
            All rights reserved.
          </div>
        </Container>
      </footer>
    </>
  );
};

export default ProductDetail;
