import React, { useState, useEffect } from "react";
import { Container, Card, Row, Col, Button, Alert, Spinner } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Clock } from "react-bootstrap-icons";
import axios from "axios";
import Header from "../Header";

const PaymentStatus = ({ userData, onLogout }) => {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `/api/payments/status/${transactionId}`
        );
        setStatus(response.data.data);
        setError(null);
      } catch (err) {
        console.error("Error checking payment status:", err);
        setError("Failed to retrieve payment status. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    checkStatus();

    // Poll for status updates every 10 seconds
    const interval = setInterval(checkStatus, 10000);

    return () => clearInterval(interval);
  }, [transactionId]);

  // Format currency
  const formatRupiah = (price) => {
    if (!price) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Get status display info
  const getStatusInfo = () => {
    const paymentStatus = status?.paymentStatus?.toLowerCase();

    if (paymentStatus === "success") {
      return {
        icon: <CheckCircle size={48} className="text-success mb-3" />,
        title: "Payment Successful",
        message:
          "Your payment has been successfully processed. Thank you for your purchase!",
        variant: "success",
      };
    } else if (paymentStatus === "pending") {
      return {
        icon: <ClockFill size={48} className="text-warning mb-3" />,
        title: "Payment Pending",
        message:
          "We're waiting for confirmation from the bank. This may take a few minutes.",
        variant: "warning",
      };
    } else if (paymentStatus === "failed" || paymentStatus === "expire") {
      return {
        icon: <XCircle size={48} className="text-danger mb-3" />,
        title: "Payment Failed",
        message:
          "Your payment could not be processed. Please try again or contact support.",
        variant: "danger",
      };
    } else {
      return {
        icon: <Clock size={48} className="text-info mb-3" />,
        title: "Payment Status Unknown",
        message:
          "We couldn't determine the status of your payment. Please check back later.",
        variant: "info",
      };
    }
  };

  const statusInfo = status ? getStatusInfo() : null;

  return (
    <>
      <Header userData={userData} onLogout={onLogout} />
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8}>
            {loading ? (
              <Card className="text-center shadow-sm p-5">
                <Spinner
                  animation="border"
                  role="status"
                  className="mx-auto mb-3"
                >
                  <span className="visually-hidden">
                    Checking payment status...
                  </span>
                </Spinner>
                <h3>Checking Payment Status</h3>
                <p className="text-muted">
                  Please wait while we check the status of your payment...
                </p>
              </Card>
            ) : error ? (
              <Alert variant="danger">{error}</Alert>
            ) : status ? (
              <Card className="shadow-sm">
                <Card.Body className="text-center p-5">
                  {statusInfo.icon}
                  <h2 className="mb-3">{statusInfo.title}</h2>
                  <p className="mb-4">{statusInfo.message}</p>

                  <Alert variant={statusInfo.variant} className="text-start">
                    <Row className="mb-2">
                      <Col xs={5} md={4} className="text-muted">
                        Transaction ID:
                      </Col>
                      <Col>{status.transactionId}</Col>
                    </Row>
                    <Row className="mb-2">
                      <Col xs={5} md={4} className="text-muted">
                        Payment ID:
                      </Col>
                      <Col>{status.paymentId}</Col>
                    </Row>
                    {status.details?.transaction_time && (
                      <Row className="mb-2">
                        <Col xs={5} md={4} className="text-muted">
                          Transaction Time:
                        </Col>
                        <Col>
                          {new Date(
                            status.details.transaction_time
                          ).toLocaleString()}
                        </Col>
                      </Row>
                    )}
                    {status.details?.gross_amount && (
                      <Row className="mb-2">
                        <Col xs={5} md={4} className="text-muted">
                          Amount:
                        </Col>
                        <Col>{formatRupiah(status.details.gross_amount)}</Col>
                      </Row>
                    )}
                  </Alert>

                  <div className="d-grid gap-3 d-md-flex justify-content-md-center mt-4">
                    <Button
                      variant="primary"
                      onClick={() => navigate("/dashboard/customer")}
                    >
                      Go to Dashboard
                    </Button>

                    {status.paymentStatus?.toLowerCase() === "pending" && (
                      <Button
                        variant="outline-secondary"
                        onClick={() => window.location.reload()}
                      >
                        Refresh Status
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            ) : (
              <Alert variant="warning">
                No payment information found for this transaction. Please
                contact customer support.
              </Alert>
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default PaymentStatus;
