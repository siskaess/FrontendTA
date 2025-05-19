import React, { useState } from "react";
import {
  Container,
  Card,
  Row,
  Col,
  Button,
  Alert,
  Spinner,
} from "react-bootstrap";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  Bank,
  Clock,
  InfoCircle,
  ExclamationTriangle,
} from "react-bootstrap-icons";
import Header from "../Header";
import axios from "axios";

const PaymentInstructions = ({ userData, onLogout }) => {
  const { transactionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  const { bank, vaNumber, amount, orderId, expiryTime } = location.state || {};

  const formatRupiah = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatExpiryTime = (isoDate) => {
    if (!isoDate) return "24 hours from now";

    const date = new Date(isoDate);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getBankInfo = (bankCode) => {
    switch (bankCode?.toLowerCase()) {
      case "bca":
        return {
          name: "Bank Central Asia (BCA)",
          logo: "https://example.com/bca-logo.png",
          instructions: [
            "Sign in to your BCA Mobile app or KlikBCA",
            "Select 'Transfer' and then 'Virtual Account'",
            `Input the Virtual Account number: ${vaNumber}`,
            `Verify the transaction amount: ${formatRupiah(amount)}`,
            "Confirm and complete payment",
          ],
        };
      case "bni":
        return {
          name: "Bank Negara Indonesia (BNI)",
          logo: "https://example.com/bni-logo.png",
          instructions: [
            "Sign in to your BNI Mobile Banking or Internet Banking",
            "Select 'Transfer' and then 'Virtual Account'",
            `Input the Virtual Account number: ${vaNumber}`,
            `Verify the transaction amount: ${formatRupiah(amount)}`,
            "Confirm and complete payment",
          ],
        };
      case "bri":
        return {
          name: "Bank Rakyat Indonesia (BRI)",
          logo: "https://example.com/bri-logo.png",
          instructions: [
            "Sign in to your BRI Mobile Banking or Internet Banking",
            "Select 'Payment' and then 'Virtual Account'",
            `Input the Virtual Account number: ${vaNumber}`,
            `Verify the transaction amount: ${formatRupiah(amount)}`,
            "Confirm and complete payment",
          ],
        };
      default:
        return {
          name: "Bank Transfer",
          logo: null,
          instructions: [
            "Log in to your mobile or internet banking",
            "Select transfer to virtual account",
            `Input the Virtual Account number: ${vaNumber}`,
            `Verify the transaction amount: ${formatRupiah(amount)}`,
            "Confirm and complete payment",
          ],
        };
    }
  };

  const bankInfo = getBankInfo(bank);

  const handleCancelPayment = async () => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this payment? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsCancelling(true);
    setCancelError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `/api/transactions/cancel/${transactionId}`, 
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(response.data.message || "Payment cancelled successfully!");
      navigate("/dashboard/customer");
    } catch (err) {
      console.error("Error cancelling payment:", err);
      setCancelError(
        err.response?.data?.message ||
          "Failed to cancel payment. Please try again."
      );
      setIsCancelling(false);
    }
  };

  if (!location.state) {
    return (
      <>
        <Header userData={userData} onLogout={onLogout} />
        <Container className="py-5 text-center">
          <Alert variant="warning">
            Payment details are missing. Cannot display instructions.
          </Alert>
          <Button
            variant="secondary"
            onClick={() => navigate("/dashboard/customer")}
          >
            Go to Dashboard
          </Button>
        </Container>
      </>
    );
  }

  return (
    <>
      <Header userData={userData} onLogout={onLogout} />
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="shadow-sm border-0">
              <Card.Header className="bg-white border-0 text-center py-4">
                <h3 className="mb-0">Payment Instructions</h3>
                <p className="text-muted mb-0">Order ID: {orderId}</p>
              </Card.Header>

              <Card.Body className="px-md-5">
                {cancelError && <Alert variant="danger">{cancelError}</Alert>}

                <Alert variant="info" className="d-flex align-items-center">
                  <InfoCircle className="me-3" size={24} />
                  <div>
                    <strong>Complete your payment before:</strong>
                    <div>{formatExpiryTime(expiryTime)}</div>
                  </div>
                </Alert>

                <div className="text-center mb-4 py-3">
                  <h4 className="mb-3">Total Amount</h4>
                  <h2 className="text-primary mb-0">{formatRupiah(amount)}</h2>
                </div>

                <Card className="mb-4">
                  <Card.Body>
                    <div className="d-flex align-items-center mb-3">
                      <Bank size={22} className="me-2" />
                      <h5 className="mb-0">
                        {bankInfo?.name || "Bank Transfer"}
                      </h5>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-3 bg-light p-3 rounded">
                      <span>Virtual Account Number</span>
                      <h5 className="mb-0">{vaNumber}</h5>
                    </div>

                    <Button
                      variant="outline-secondary"
                      size="sm"
                      className="mb-3"
                      onClick={() => {
                        navigator.clipboard.writeText(vaNumber);
                        alert("Virtual Account number copied to clipboard");
                      }}
                    >
                      Copy Virtual Account Number
                    </Button>

                    <h6 className="mt-4 mb-3">Payment Instructions:</h6>
                    <ol className="ps-3">
                      {bankInfo?.instructions?.map((instruction, index) => (
                        <li key={index} className="mb-2">
                          {instruction}
                        </li>
                      ))}
                    </ol>
                  </Card.Body>
                </Card>

                <div className="d-flex flex-column flex-md-row justify-content-between mt-4">
                  <Button
                    variant="outline-secondary"
                    onClick={() => navigate("/dashboard/customer")}
                    className="mb-3 mb-md-0"
                    disabled={isCancelling}
                  >
                    Back to Dashboard
                  </Button>

                  <div className="d-flex flex-column flex-md-row gap-2">
                    <Button
                      variant="outline-primary"
                      onClick={() =>
                        navigate(`/payment-status/${transactionId}`)
                      }
                      disabled={isCancelling}
                    >
                      Check Payment Status
                    </Button>

                    <Button
                      variant="outline-danger"
                      onClick={handleCancelPayment}
                      disabled={isCancelling}
                    >
                      {isCancelling ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                          />
                          <span className="ms-1">Cancelling...</span>
                        </>
                      ) : (
                        <>
                          <ExclamationTriangle className="me-1" /> Cancel
                          Payment
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default PaymentInstructions;
