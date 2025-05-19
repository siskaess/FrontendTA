import React from "react";
import { Container, Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "react-bootstrap-icons";
import Header from "../Header";

const PaymentSuccess = ({ userData, onLogout }) => {
  const navigate = useNavigate();

  return (
    <>
      <Header userData={userData} onLogout={onLogout} />
      <Container
        className="py-5 d-flex align-items-center justify-content-center"
        style={{ minHeight: "70vh" }}
      >
        <Card
          className="text-center shadow-sm border-0"
          style={{ maxWidth: "600px" }}
        >
          <Card.Body className="py-5 px-md-5">
            <CheckCircle size={80} className="text-success mb-4" />
            <h1 className="mb-3">Payment Successful!</h1>
            <p className="lead mb-4">
              Thank you for your purchase. Your payment has been successfully
              processed.
            </p>
            <p className="text-muted mb-5">
              You will receive a confirmation email shortly with your
              transaction details.
            </p>

            <div className="d-grid gap-3 d-md-flex justify-content-md-center">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate("/dashboard/customer")}
                style={{
                  backgroundColor: "#95b8d1",
                  borderColor: "#95b8d1",
                }}
              >
                Return to Dashboard
              </Button>

              <Button
                variant="outline-secondary"
                size="lg"
                onClick={() => navigate("/")}
              >
                Continue Shopping
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </>
  );
};

export default PaymentSuccess;
