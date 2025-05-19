import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Button,
  Row,
  Col,
  Nav,
  Table,
  Form,
  InputGroup,
  Badge,
  Spinner,
  Alert,
  Dropdown,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../Header";
import {
  ArrowUp,
  ArrowDown,
  PencilSquare,
  Image as ImageIcon,
} from "react-bootstrap-icons"; // Updated icon imports

const OfficeWorkerDashboard = ({ userData, onLogout }) => {
  const [activeTab, setActiveTab] = useState("products");
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [transactionFilter, setTransactionFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactionError, setTransactionError] = useState(null);
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [transactionSortBy, setTransactionSortBy] = useState("date");
  const [transactionSortOrder, setTransactionSortOrder] = useState("desc");
  const [schedules, setSchedules] = useState([]);
  const [scheduleFilter, setScheduleFilter] = useState("all");
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const response = await axios.get(
          `/api/products?sortBy=${sortBy}&sortOrder=${sortOrder}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setProducts(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [sortBy, sortOrder]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setTransactionsLoading(true);
        const token = localStorage.getItem("token");

        let endpoint = `/api/transactions/all?sortBy=${transactionSortBy}&sortOrder=${transactionSortOrder}`;
        if (transactionFilter === "pending") {
          endpoint = `/api/transactions/pending?sortBy=${transactionSortBy}&sortOrder=${transactionSortOrder}`;
        } else if (transactionFilter === "done") {
          endpoint = `/api/transactions/done?sortBy=${transactionSortBy}&sortOrder=${transactionSortOrder}`;
        }

        const response = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setTransactions(response.data);
        setTransactionError(null);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setTransactionError(
          "Failed to load transaction data. Please try again."
        );
      } finally {
        setTransactionsLoading(false);
      }
    };

    fetchTransactions();
  }, [transactionFilter, transactionSortBy, transactionSortOrder]);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setSchedulesLoading(true);
        const token = localStorage.getItem("token");

        let endpoint = "/api/schedules";

        const response = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        let filteredData = response.data;
        if (scheduleFilter !== "all") {
          filteredData = response.data.filter(
            (s) => s.status === scheduleFilter
          );
        }

        setSchedules(filteredData);
        setScheduleError(null);
      } catch (err) {
        console.error("Error fetching schedules:", err);
        setScheduleError("Failed to load schedule data. Please try again.");
      } finally {
        setSchedulesLoading(false);
      }
    };

    fetchSchedules();
  }, [scheduleFilter]);

  const handleAddProduct = () => {
    navigate("/products/add");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const options = { year: "numeric", month: "short", day: "numeric" };
      return new Date(dateString).toLocaleDateString("en-US", options);
    } catch (error) {
      console.error("Date formatting error:", error);
      return dateString;
    }
  };

  const handleConfirmPayment = async (transactionId) => {
    try {
      const token = localStorage.getItem("token");

      console.log(transactionId);
      
      const response = await axios.put(
        `/api/transactions/confirm/${transactionId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // setTransactions(
      //   transactions.map((transaction) =>
      //     transaction._id === transactionId || transaction.id === transactionId
      //       ? { ...transaction, status: "done" }
      //       : transaction
      //   )
      // );
      const updatedTransactionFromServer = response.data.transaction;

      setTransactions(
        transactions.map((t) =>
          t.transactionId === transactionId // Match by the transactionId string
            ? updatedTransactionFromServer // Use the full updated transaction from the server
            : t
        )
      );
    } catch (err) {
      console.error("Error confirming transaction:", err);
      alert("Failed to confirm payment. Please try again.");
    }
  };

  const renderAssignedTo = (assignToArray) => {
    if (!assignToArray || assignToArray.length === 0) {
      return <span className="text-muted">Unassigned</span>;
    }
    return assignToArray.map((worker) => worker.name).join(", ");
  };

  const isAssignable = (schedule) => {
    return (
      schedule.status === "pending" &&
      (!schedule.assignTo || schedule.assignTo.length === 0)
    );
  };

  const filteredProducts = products.filter((product) => {
    const query = searchTerm.toLowerCase();
    const name =
      typeof product.name === "string" ? product.name.toLowerCase() : "";
    const type =
      typeof product.type === "string" ? product.type.toLowerCase() : "";
    return name.includes(query) || type.includes(query);
  });

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
  
  return (
    <>
      <Header userData={userData} onLogout={onLogout} />
      <Container fluid className="p-0">
        <Container className="py-4">
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Body>
              <h5>Welcome, {userData?.name || userData?.email || ""}</h5>
              <p className="text-muted">
                Manage products, confirm payments, and schedule services from
                this dashboard.
              </p>
            </Card.Body>
          </Card>

          <Row className="mb-4">
            <Col md={12}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="d-flex justify-content-around">
                  <div className="text-center">
                    <h5>{loading ? <Spinner size="sm" /> : products.length}</h5>
                    <small className="text-muted">Products</small>
                  </div>
                  <div className="text-center">
                    <h5>
                      {transactionsLoading ? (
                        <Spinner size="sm" />
                      ) : (
                        transactions.filter((t) => t.status === "pending")
                          .length
                      )}
                    </h5>
                    <small className="text-muted">Pending Payments</small>
                  </div>
                  <div className="text-center">
                    <h5>
                      {schedulesLoading ? (
                        <Spinner size="sm" />
                      ) : (
                        schedules.filter((s) => s.status === "pending").length
                      )}
                    </h5>
                    <small className="text-muted">Pending Schedules</small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Nav variant="tabs" className="mb-3">
            <Nav.Item>
              <Nav.Link
                active={activeTab === "products"}
                onClick={() => setActiveTab("products")}
              >
                Products
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={activeTab === "payments"}
                onClick={() => setActiveTab("payments")}
              >
                Payments
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={activeTab === "schedules"}
                onClick={() => setActiveTab("schedules")}
              >
                Schedule
              </Nav.Link>
            </Nav.Item>
          </Nav>

          {activeTab === "products" && (
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white d-flex flex-wrap justify-content-between align-items-center gap-2">
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <h5 className="m-0 me-3">Product Management</h5>
                  <InputGroup size="sm" style={{ maxWidth: "250px" }}>
                    <Form.Control
                      placeholder="Search name or type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => setSearchTerm("")}
                    >
                      Clear
                    </Button>
                  </InputGroup>
                  <div className="d-flex align-items-center gap-1">
                    <Dropdown size="sm">
                      <Dropdown.Toggle
                        variant="outline-secondary"
                        id="dropdown-sort"
                      >
                        Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => setSortBy("name")}>
                          Name
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => setSortBy("price")}>
                          Price
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => setSortBy("type")}>
                          Type
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => setSortBy("stock")}>
                          Stock
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() =>
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                      }
                      aria-label={
                        sortOrder === "asc"
                          ? "Sort Descending"
                          : "Sort Ascending"
                      }
                    >
                      {sortOrder === "asc" ? <ArrowUp /> : <ArrowDown />}
                    </Button>
                  </div>
                </div>
                <Button size="sm" variant="primary" onClick={handleAddProduct}>
                  Add New Product
                </Button>
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">
                        Loading products...
                      </span>
                    </Spinner>
                  </div>
                ) : error ? (
                  <Alert variant="danger">{error}</Alert>
                ) : filteredProducts.length === 0 ? (
                  <Alert variant="info">
                    {products.length === 0
                      ? "No products found. Add your first product!"
                      : "No products match your search criteria."}
                  </Alert>
                ) : (
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Brand</th>
                        <th>Price (IDR)</th>
                        <th>Stock</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => {
                        const productId = product._id || product.id;
                        const imageUrl = product.image
                          ? product.image.startsWith("http")
                            ? product.image
                            : `/${product.image.replace(/\\/g, "/")}`
                          : null;

                        return (
                          <tr key={productId}>
                            <td>
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={product.name}
                                  style={{
                                    width: "50px",
                                    height: "50px",
                                    objectFit: "cover",
                                  }}
                                  className="rounded"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "placeholder_image_path";
                                    e.target.style.display = "none";
                                  }}
                                />
                              ) : (
                                <div
                                  className="bg-light rounded d-flex align-items-center justify-content-center"
                                  style={{ width: "50px", height: "50px" }}
                                >
                                  <ImageIcon color="#adb5bd" size={24} />
                                </div>
                              )}
                            </td>
                            <td>{product.name || "N/A"}</td>
                            <td>{product.type || "N/A"}</td>
                            <td>{product.brand || "N/A"}</td>
                            <td>
                              {typeof product.price === "number"
                                ? `Rp ${product.price.toLocaleString("id-ID")}`
                                : "N/A"}
                            </td>
                            <td>{product.stock ?? "N/A"}</td>
                            <td>
                              <div className="d-flex gap-2">
                                <Link to={`/products/edit/${productId}`}>
                                  <Button
                                    size="sm"
                                    variant="outline-primary"
                                    title="Edit Product"
                                  >
                                    <PencilSquare />
                                  </Button>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          )}

          {activeTab === "payments" && (
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                <h5 className="m-0">Payment Confirmation</h5>
                <div className="d-flex align-items-center gap-2">
                  <Dropdown className="me-2">
                    <Dropdown.Toggle variant="outline-secondary" id="dropdown-filter">
                      {transactionFilter === "all"
                        ? "All Payments"
                        : transactionFilter === "pending"
                        ? "Pending Only"
                        : "Completed Only"}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => setTransactionFilter("all")}>
                        All Payments
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => setTransactionFilter("pending")}>
                        Pending Only
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => setTransactionFilter("done")}>
                        Completed Only
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                  <div className="d-flex align-items-center gap-1">
                    <Dropdown size="sm">
                      <Dropdown.Toggle variant="outline-secondary" id="dropdown-sort-transactions">
                        Sort: {transactionSortBy.charAt(0).toUpperCase() + transactionSortBy.slice(1)}
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => setTransactionSortBy("id")}>
                          Transaction ID
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => setTransactionSortBy("amount")}>
                          Amount
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => setTransactionSortBy("date")}>
                          Date
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() =>
                        setTransactionSortOrder(transactionSortOrder === "asc" ? "desc" : "asc")
                      }
                      aria-label={
                        transactionSortOrder === "asc"
                          ? "Sort Descending"
                          : "Sort Ascending"
                      }
                    >
                      {transactionSortOrder === "asc" ? <ArrowUp /> : <ArrowDown />}
                    </Button>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                {transactionsLoading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">
                        Loading transactions...
                      </span>
                    </Spinner>
                  </div>
                ) : transactionError ? (
                  <Alert variant="danger">{transactionError}</Alert>
                ) : transactions.length === 0 ? (
                  <Alert variant="info">
                    No {transactionFilter !== "all" ? transactionFilter : ""}{" "}
                    transactions found.
                  </Alert>
                ) : (
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Transaction ID</th>
                        <th>Customer</th>
                        <th>Amount (IDR)</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
                        <tr key={transaction._id || transaction.id}>
                          <td>{transaction.transactionId}</td>
                          <td>
                            {transaction.user ||
                              transaction.customer ||
                              "Unknown"}
                          </td>
                          <td>
                            {`Rp ${transaction.totalPrice?.toLocaleString()}` ||
                              "N/A"}
                          </td>
                          <td>
                            {formatDate(
                              transaction.createdAt || transaction.date
                            )}
                          </td>
                          <td>
                            <Badge
                              bg={
                                transaction.status === "done" ||
                                transaction.status === "completed"
                                  ? "success"
                                  : "warning"
                              }
                            >
                              {transaction.status}
                            </Badge>
                          </td>
                          <td>
                            <Link
                              to={`/payments/detail/${
                                transaction.transactionId || transaction.id
                              }`}
                            >
                              <Button
                                size="sm"
                                variant="outline-info"
                                className="me-2"
                              >
                                View
                              </Button>
                            </Link>
                            {transaction.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline-success"
                                onClick={() =>
                                  handleConfirmPayment(
                                    transaction.transactionId
                                  )
                                }
                              >
                                Confirm
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          )}

          {activeTab === "schedules" && (
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                <h5 className="m-0">Schedule Management</h5>
                <div className="d-flex">
                  <Dropdown className="me-2">
                    <Dropdown.Toggle
                      variant="outline-secondary"
                      id="dropdown-schedule-filter"
                      size="sm"
                    >
                      {scheduleFilter === "all"
                        ? "All Schedules"
                        : scheduleFilter === "pending"
                        ? "Pending Only"
                        : "Completed Only"}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => setScheduleFilter("all")}>
                        All Schedules
                      </Dropdown.Item>
                      <Dropdown.Item
                        onClick={() => setScheduleFilter("pending")}
                      >
                        Pending Only
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => setScheduleFilter("done")}>
                        Completed Only
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              </Card.Header>
              <Card.Body>
                {schedulesLoading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">
                        Loading schedules...
                      </span>
                    </Spinner>
                  </div>
                ) : scheduleError ? (
                  <Alert variant="danger">{scheduleError}</Alert>
                ) : schedules.length === 0 ? (
                  <Alert variant="info">
                    No {scheduleFilter !== "all" ? scheduleFilter : ""}{" "}
                    schedules found.
                  </Alert>
                ) : (
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Assigned To</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedules.map((schedule) => {
                        const scheduleId = schedule._id || schedule.id;
                        return (
                          <tr key={scheduleId}>
                            <td>{schedule.customerName}</td>
                            <td>{formatDate(schedule.date)}</td>
                            <td>
                              {schedule.time || (
                                <span className="text-muted">Not set</span>
                              )}
                            </td>
                            <td>{renderAssignedTo(schedule.assignTo)}</td>
                            <td>
                              <Badge
                                bg={
                                  schedule.status === "done"
                                    ? "success"
                                    : "warning"
                                }
                                pill
                              >
                                {schedule.status}
                              </Badge>
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <Link to={`/schedules/detail/${scheduleId}`}>
                                  <Button
                                    size="sm"
                                    variant="outline-info"
                                    title="View Details"
                                  >
                                    View
                                  </Button>
                                </Link>
                                {schedule.status === "pending" && (
                                  <Link to={`/schedules/edit/${scheduleId}`}>
                                    <Button
                                      size="sm"
                                      variant="outline-primary"
                                      title="Update Schedule"
                                    >
                                      Update
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          )}
        </Container>
      </Container>
    </>
  );
};

export default OfficeWorkerDashboard;