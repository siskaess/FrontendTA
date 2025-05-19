import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Button,
  Row,
  Col,
  Form,
  InputGroup,
  Carousel,
  Spinner,
  Alert,
} from "react-bootstrap";
import {
  ArrowDown,
  ArrowUp,
  Telephone,
  GeoAltFill,
  ChatQuoteFill,
} from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import axios from "axios";

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("name");
  const [sortOrder, setSortOrder] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState(null);

  const navigate = useNavigate();

  // Fetch public data on mount
  useEffect(() => {
    fetchProducts();
    fetchComments();
  }, []); // Fetch once on mount

  // Re-fetch products when sorting changes
  useEffect(() => {
    fetchProducts();
  }, [sortOption, sortOrder]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Fetch public product list (no auth needed assumed)
      let endpoint = `/api/products?sortBy=${sortOption}&sortOrder=${sortOrder}`;
      const response = await axios.get(endpoint);
      setProducts(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to load products. Please try again later.");
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      setCommentsLoading(true);
      // Fetch public comments (no auth needed assumed)
      const response = await axios.get("/api/users/comments");
      setComments(Array.isArray(response.data) ? response.data : []);
      setCommentsError(null);
    } catch (err) {
      console.error("Error fetching comments:", err);
      setCommentsError("Failed to load customer feedback.");
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  // Navigate to login when trying to view details (or could show a prompt)
  const handleViewDetails = (productId) => {
    // Option 1: Directly navigate to login
    navigate(`/login`);
    // Option 2: Show a message/modal asking to log in first
    // alert("Please log in to view product details and purchase.");
  };

  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase();
    const name =
      typeof product.name === "string" ? product.name.toLowerCase() : "";
    const description =
      typeof product.description === "string"
        ? product.description.toLowerCase()
        : "";
    return name.includes(query) || description.includes(query);
  });

  const formatRupiah = (price) => {
    if (price === undefined || price === null) return "Rp N/A";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <>
      {/* Pass isAuthenticated={false} to Header */}
      <Header isAuthenticated={false} />
      <Container fluid className="p-0">
        <Container className="py-4">
          <Card className="mb-4 border-0 shadow-sm text-center">
            <Card.Body>
              <h5>Welcome to CV. Matanova Security Technology</h5>
              <p className="text-muted">
                Browse our security products below. Please log in to purchase or
                view details.
              </p>
            </Card.Body>
          </Card>

          {/* Customer Feedback Carousel */}
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-white d-flex align-items-center">
              <ChatQuoteFill className="me-2 text-primary" />
              <h5 className="m-0">What Our Customers Say</h5>
            </Card.Header>
            <Card.Body
              style={{
                minHeight: "150px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {commentsLoading ? (
                <Spinner animation="border" role="status" variant="primary">
                  <span className="visually-hidden">Loading feedback...</span>
                </Spinner>
              ) : commentsError ? (
                <Alert variant="warning" className="w-100 text-center m-0">
                  {commentsError}
                </Alert>
              ) : comments.length > 0 ? (
                <Carousel
                  indicators={false}
                  interval={5000}
                  pause="hover"
                  className="w-100"
                >
                  {comments.map((comment, index) => (
                    <Carousel.Item
                      key={index}
                      className="text-center px-5 py-3"
                    >
                      <blockquote className="blockquote mb-0">
                        <p className="mb-0 fst-italic">"{comment}"</p>
                        <footer className="blockquote-footer mt-2">
                          Anonymous Customer
                        </footer>
                      </blockquote>
                    </Carousel.Item>
                  ))}
                </Carousel>
              ) : (
                <p className="text-muted m-0">No feedback available yet.</p>
              )}
            </Card.Body>
          </Card>

          {/* Product Search and Sort */}
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Body>
              <Row>
                <Col md={7} className="mb-3 mb-md-0">
                  <InputGroup>
                    <Form.Control
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => setSearchQuery("")}
                    >
                      Clear
                    </Button>
                  </InputGroup>
                </Col>
                <Col md={5}>
                  <div className="d-flex align-items-center">
                    <Form.Group className="me-3 flex-grow-1">
                      <Form.Select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                      >
                        <option value="name">Name</option>
                        <option value="price">Price</option>
                        <option value="type">Type</option>
                      </Form.Select>
                    </Form.Group>
                    <div className="d-flex align-items-end pb-1">
                      <Button
                        variant="link"
                        className="p-0 ms-2"
                        onClick={toggleSortOrder}
                        aria-label={
                          sortOrder === "asc"
                            ? "Sort Descending"
                            : "Sort Ascending"
                        }
                      >
                        {sortOrder === "asc" ? (
                          <ArrowUp size={24} />
                        ) : (
                          <ArrowDown size={24} />
                        )}
                      </Button>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Product Listing */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white">
              <h5 className="m-0">Available Products</h5>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-5">
                  <h5>Loading products...</h5>
                </div>
              ) : error ? (
                <div className="text-center py-5">
                  <h5 className="text-danger">{error}</h5>
                  <Button
                    variant="outline-primary"
                    onClick={fetchProducts}
                    className="mt-3"
                  >
                    Try Again
                  </Button>
                </div>
              ) : (
                <Row>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <Col
                        xs={12}
                        sm={6}
                        md={4}
                        lg={3}
                        key={product._id}
                        className="mb-4"
                      >
                        <Card className="h-100 border product-card">
                          <div
                            className="product-image-container"
                            style={{
                              height: "200px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              overflow: "hidden",
                              backgroundColor: "#f8f9fa",
                            }}
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
                              <p className="text-muted m-0">No image</p>
                            )}
                          </div>
                          <Card.Body>
                            <Card.Title
                              className="h6 text-truncate"
                              title={product.name}
                            >
                              {product.name}
                            </Card.Title>
                            <Card.Text className="text-primary fw-bold mb-2">
                              {formatRupiah(product.price)}
                            </Card.Text>
                            {/* Don't show stock for public view? Or show simplified status */}
                            {product.stock !== undefined && (
                              <small className="text-muted d-block mb-2">
                                {product.stock > 0
                                  ? `Available`
                                  : "Out of stock"}
                              </small>
                            )}
                          </Card.Body>
                          <Card.Footer className="bg-white border-top-0">
                            <div className="d-grid gap-2">
                              <Button
                                variant="outline-primary"
                                style={{
                                  borderColor: "#95b8d1",
                                  color: "#95b8d1",
                                }}
                                className="w-100"
                                onClick={() => handleViewDetails(product._id)} // Changed action
                              >
                                View Details
                              </Button>
                            </div>
                          </Card.Footer>
                        </Card>
                      </Col>
                    ))
                  ) : (
                    <Col xs={12} className="text-center py-5">
                      <h5>No products found matching your search criteria.</h5>
                    </Col>
                  )}
                </Row>
              )}
            </Card.Body>
          </Card>
        </Container>

        {/* Footer */}
        <footer className="bg-dark text-white py-4 mt-4">
          <Container>
            <Row className="justify-content-between">
              <Col md={4} className="mb-4 mb-md-0">
                <h5 className="mb-3">CV. Matanova Security Technology</h5>
                <p className="text-light mb-0">
                  Your trusted partner for high-quality security solutions and
                  equipment. Professional service with more than 10 years of
                  experience.
                </p>
              </Col>
              <Col md={3} className="mb-4 mb-md-0">
                <h5 className="mb-3">Contact Us</h5>
                <ul className="list-unstyled">
                  <li className="mb-2">
                    <Telephone className="me-2" />
                    <a
                      href="tel:+6281318996474"
                      className="text-decoration-none text-light"
                    >
                      +62 813-1899-6474
                    </a>
                  </li>
                  <li>
                    <GeoAltFill className="me-2" />
                    <span className="text-light">
                      Jl. Genteng Muhamadiyah No.23, Genteng, Kec. Genteng,
                      Surabaya, Jawa Timur 60275
                    </span>
                  </li>
                </ul>
              </Col>
              <Col md={3}>
                <h5 className="mb-3">Customer Service</h5>
                <p className="text-light mb-2">Need assistance?</p>
                <Button
                  variant="outline-light"
                  className="mb-2 w-100"
                  onClick={() => (window.location.href = "tel:+6281318996474")}
                >
                  <Telephone className="me-2" /> Call Support
                </Button>
                <div className="text-light-50 small">
                  Operating hours:
                  <br />
                  Monday - Saturday: 08:00 - 16:30
                </div>
              </Col>
            </Row>
            <hr className="my-4 bg-secondary" />
            <div className="text-center text-light-50 small">
              &copy; {new Date().getFullYear()} CV. Matanova Security
              Technology. All rights reserved.
            </div>
          </Container>
        </footer>
      </Container>
    </>
  );
};

export default HomePage;
