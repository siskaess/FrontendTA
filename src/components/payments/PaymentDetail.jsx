import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Button,
  Row,
  Col,
  Badge,
  Spinner,
  Alert,
  Table,
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../Header";

const PaymentDetail = ({ userData, onLogout }) => {
  const { id } = useParams(); // This is now the transactionId from URL
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transaction, setTransaction] = useState(null);

  useEffect(() => {
    const fetchTransactionDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        // Use the transactionId from URL params directly
        const response = await axios.get(`/api/transactions/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Since the API returns an array with one transaction, get the first item
        const transactionData = Array.isArray(response.data)
          ? response.data[0]
          : response.data;

        console.log("Transaction data:", transactionData);
        setTransaction(transactionData);
        setError(null);
      } catch (err) {
        console.error("Error fetching transaction details:", err);
        setError(
          "Failed to load transaction details. The transaction may not exist."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionDetails();
  }, [id]);

  const handleConfirmPayment = async () => {
    try {
      const token = localStorage.getItem("token");

      // Use transactionId instead of MongoDB _id
      await axios.put(
        `/api/transactions/confirm/${transaction.transactionId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setTransaction({
        ...transaction,
        status: "done",
      });

      alert("Payment confirmed successfully!");
    } catch (err) {
      console.error("Error confirming payment:", err);
      alert("Failed to confirm payment. Please try again.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const options = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
      return new Date(dateString).toLocaleDateString("en-US", options);
    } catch (error) {
      console.error("Date formatting error:", error);
      return dateString;
    }
  };

  return (
    <>
      <Header userData={userData} onLogout={onLogout} />
      <Container className="py-5">
        {loading ? (
          <div className="text-center">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">
                Loading transaction details...
              </span>
            </Spinner>
            <p className="mt-3">Loading transaction information...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : transaction ? (
          <Card className="shadow-sm">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <div>
                <h4 className="mb-0">Transaction Receipt</h4>
                <small className="text-muted">
                  Transaction ID: {transaction.transactionId}
                </small>
              </div>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => navigate("/dashboard/office")}
              >
                Back to Dashboard
              </Button>
            </Card.Header>
            <Card.Body>
              <Row className="mb-4">
                <Col md={6}>
                  <p className="mb-1">
                    <strong>Customer:</strong>{" "}
                    {transaction.user || transaction.customer || "Unknown"}
                  </p>
                  <p className="mb-1">
                    <strong>Location:</strong>{" "}
                    {transaction.location || "Not specified"}
                  </p>
                  <p className="mb-1">
                    <strong>Status:</strong>{" "}
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
                  </p>
                </Col>
                <Col md={6} className="text-md-end">
                  <p className="mb-1">
                    <strong>Date:</strong>{" "}
                    {formatDate(transaction.createdAt || transaction.date)}
                  </p>
                  <p className="mb-1">
                    <strong>Payment Method:</strong>{" "}
                    {transaction.paymentMethod || "Standard Payment"}
                  </p>
                </Col>
              </Row>

              <Card className="mb-4 receipt-card">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Purchased Items</h5>
                </Card.Header>
                <Table striped hover responsive className="mb-0">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Item</th>
                      <th className="text-center">Quantity</th>
                      <th className="text-end">Unit Price</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transaction.products &&
                      transaction.products.map((product, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>
                            <strong>{product}</strong>
                          </td>
                          <td className="text-center">
                            {transaction.qty ? transaction.qty[index] : 1}
                          </td>
                          <td className="text-end">
                            Rp{" "}
                            {transaction.prices && transaction.prices[index]
                              ? transaction.prices[index].toLocaleString()
                              : "N/A"}
                          </td>
                          <td className="text-end">
                            Rp{" "}
                            {transaction.prices &&
                            transaction.prices[index] &&
                            transaction.qty
                              ? (
                                  transaction.prices[index] *
                                  transaction.qty[index]
                                ).toLocaleString()
                              : "N/A"}
                          </td>
                        </tr>
                      ))}

                    {!transaction.products ||
                    transaction.products.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center">
                          No items in this transaction
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                  <tfoot className="table-group-divider">
                    <tr>
                      <td colSpan="4" className="text-end fw-bold fs-5">
                        Total:
                      </td>
                      <td className="text-end fw-bold fs-5">
                        Rp {transaction.totalPrice?.toLocaleString() || "N/A"}
                      </td>
                    </tr>
                  </tfoot>
                </Table>
              </Card>

              <div className="mt-4 d-flex justify-content-between">
                <Button variant="primary" onClick={() => window.print()}>
                  Print Receipt
                </Button>
              </div>
            </Card.Body>
            <Card.Footer className="bg-white text-center text-muted">
              <small>
                This is a computer-generated receipt and does not require a
                signature.
              </small>
            </Card.Footer>
          </Card>
        ) : (
          <Alert variant="warning">
            Transaction not found. The transaction may have been deleted or you
            may not have permission to view it.
          </Alert>
        )}
      </Container>
    </>
  );
};

export default PaymentDetail;
