import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Button,
  Row,
  Col,
  Form,
  InputGroup,
  Table,
  Badge,
  Carousel,
  Spinner,
  Alert,
} from "react-bootstrap";
import {
  ArrowDown,
  ArrowUp,
  Telephone,
  EnvelopeFill,
  GeoAltFill,
  ChatQuoteFill,
  CartFill,
  EyeFill,
} from "react-bootstrap-icons";
import { useNavigate, Link } from "react-router-dom";
import Header from "../Header";
import axios from "axios";
import { useCart } from "../../context/CartContext";

const CustomerDashboard = ({ userData, onLogout }) => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("name");
  const [sortOrder, setSortOrder] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactionLoading, setTransactionLoading] = useState(true);
  const [transactionError, setTransactionError] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [hoveredIndex2, setHoveredIndex2] = useState(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false); // State untuk kontrol alert
  const { addToCart } = useCart();

  const navigate = useNavigate();

  useEffect(() => {
    // console.log("Updated userData: ", userData);
    fetchProducts();
    fetchComments();
    if (userData?.email) {
      fetchUserTransactions(userData.email);
    }
  }, [userData?.email]);

  useEffect(() => {
    fetchProducts();
  }, [sortOption, sortOrder]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let endpoint = "/api/products";

      if (sortOption && sortOrder) {
        endpoint = `/api/products?sortBy=${sortOption}&sortOrder=${sortOrder}`;
      }

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

  const fetchUserTransactions = async (email) => {
    console.log("Fetching transactions for email: ", email);
    
    try {
      setTransactionLoading(true);

      const response = await axios.get(
        `/api/transactions/display/${email}?limit=4&page=1`
      );
      console.log("Transactions received: ", response.data);

      setTransactions(response.data);
      setTransactionError(null);
    } catch (err) {
      console.error("Error fetching transactions:", err.response || err);

      if (err.response?.status === 404) {
        setTransactions([]);
        setTransactionError(null);
      } else {
        setTransactionError("Failed to load transaction history.");
      }
    } finally {
      setTransactionLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      setCommentsLoading(true);
      const response = await axios.get("/api/users/comments");
      console.log("Comments received:", response.data);

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

  const handleViewDetails = (productId) => {
    navigate(`/products/${productId}`);
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
    if (price === undefined || price === null) return "Rp 0.";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!userData) {
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <Card className="p-4 text-center">
          <h5>Loading user data...</h5>
        </Card>
      </Container>
    );
  }

  const handleAddToCart = async (id) => {
    try {
      const response = await axios.get(`/api/products/display/${id}`);
      const dataProduct = response.data;
      console.log("Product data received:", dataProduct);

      setSelectedProduct(dataProduct);
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  useEffect(() => {
    console.log("Selected product:", selectedProduct);

    if (selectedProduct && selectedProduct._id !== undefined) {
      // Jika selectedProduct sudah terupdate, baru tambahkan ke keranjang
      addToCart(selectedProduct, quantity);
      console.log("Product added to cart: ", selectedProduct);

      // Tampilkan alert sukses setelah produk berhasil ditambahkan
      setShowSuccessAlert(true);

      // Sembunyikan alert setelah beberapa detik
      setTimeout(() => {
        setShowSuccessAlert(false);
      }, 3000); // Hide alert after 3 seconds
    }
  }, [selectedProduct]); // useEffect akan dipanggil setiap kali selectedProduct berubah

  return (
    <>
      <Header userData={userData} onLogout={onLogout} />
      <div>
        {showSuccessAlert && (
          <Alert variant="success" className="mt-3">
            Product added to cart successfully!
          </Alert>
        )}

        {/* Your other component JSX here */}
      </div>
      <Container fluid className="p-0">
        <Container className="py-4">
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Body>
              <h5>Welcome, {userData?.name || "User"}</h5>
              <p className="text-muted">
                Browse our products and view your transaction history below.
              </p>
            </Card.Body>
          </Card>

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

          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white">
              <h5 className="m-0">My Transaction History</h5>
            </Card.Header>
            <Card.Body>
              {transactionLoading ? (
                <div className="text-center py-3">
                  <h6>Loading transaction history...</h6>
                </div>
              ) : transactionError ? (
                <div className="text-center py-3">
                  <h6 className="text-danger">{transactionError}</h6>
                  <Button
                    variant="outline-primary"
                    onClick={() => fetchUserTransactions(userData.email)}
                    className="mt-2"
                    size="sm"
                  >
                    Try Again
                  </Button>
                </div>
              ) : transactions.length > 0 ? (
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Transaction ID</th>
                        <th>Location</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
                        <tr key={transaction._id}>
                          <td>{formatDate(transaction.date)}</td>
                          <td className="text-muted small">
                            {transaction.transactionId}
                          </td>
                          <td>{transaction.location || "N/A"}</td>
                          <td>{transaction.products?.length || 0} items</td>
                          <td>{formatRupiah(transaction.totalPrice)}</td>
                          <td>
                            <Badge
                              bg={
                                transaction.status === "done"
                                  ? "success"
                                  : transaction.status === "pending"
                                  ? "warning"
                                  : "info"
                              }
                            >
                              {transaction.status === "done"
                                ? "Completed"
                                : transaction.status || "Processing"}
                            </Badge>
                          </td>
                          <td>
                            <Link
                              to={`/transactions/${transaction.transactionId}`}
                            >
                              <Button variant="outline-info" size="sm">
                                View Details
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p>You don't have any transactions yet.</p>
                </div>
              )}

              <div className="d-flex justify-content-center">
                <Link to="/dashboard/my-transactions" className="w-50 d-block">
                  <Button variant="primary" className="w-100">
                    Load More
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>

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
                        <option value="stock">Stock</option>
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
                    filteredProducts.map((product, index) => (
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
                            {product.stock !== undefined && (
                              <small className="text-muted d-block mb-2">
                                {product.stock > 0
                                  ? `In stock: ${product.stock}`
                                  : "Out of stock"}
                              </small>
                            )}
                            {product.type && (
                              <Badge bg="light" text="dark" className="mb-2">
                                {product.type}
                              </Badge>
                            )}
                          </Card.Body>
                          <Card.Footer className="bg-white border-top-0">
                            <div className="d-flex d-grid gap-2">
                              {product.stock > 0 ? (
                                <Button
                                  variant="outline-success"
                                  style={{
                                    borderColor: "#38a169",
                                    color: "#38a169",
                                  }}
                                  className="w-100 d-flex justify-content-center align-items-center"
                                  onClick={() => handleAddToCart(product._id)}
                                  onMouseEnter={() => setHoveredIndex(index)}
                                  onMouseLeave={() => setHoveredIndex(false)}
                                >
                                  {hoveredIndex === index ? (
                                    <CartFill size={20} color="white" />
                                  ) : (
                                    "Add To Cart"
                                  )}
                                </Button>
                              ) : (
                                <Button
                                  variant="secondary"
                                  className="w-100"
                                  disabled
                                >
                                  Out of Stock
                                </Button>
                              )}

                              <Button
                                variant="outline-primary"
                                style={{
                                  borderColor: "#95b8d1",
                                  color: "#95b8d1",
                                }}
                                className="w-100"
                                onClick={() => handleViewDetails(product._id)} // Changed action
                                onMouseEnter={() => setHoveredIndex2(index)}
                                onMouseLeave={() => setHoveredIndex2(false)}
                              >
                                {hoveredIndex2 === index ? (
                                  <EyeFill size={20} color="white" />
                                ) : (
                                  "View Details"
                                )}
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
                <p className="text-light mb-2">
                  Need assistance with your order?
                </p>
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

export default CustomerDashboard;
