import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Form,
  Button,
  Alert,
  Card,
  Container,
  Row,
  Col,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";

const Login = ({ onLogin, userData }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // If userData exists and user is already logged in, redirect to appropriate dashboard
  // If userData exists and user is already logged in, redirect to appropriate dashboard
  useEffect(() => {
    if (userData?.role) {
      navigate(
        `/dashboard/${
          userData.role === "cs"
            ? "customer"
            : userData.role === "pk"
            ? "office"
            : userData.role === "pl"
            ? "field"
            : userData.role === "ow"
            ? "owner"
            : "customer" // Default fallback
        }`
      );
    }
  }, [userData, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { email, password } = formData;

    try {
      console.log("Sending login request:", { email, password: "***" });
      const response = await axios.post("/api/auth/login", { email, password });
      console.log("Login response:", response.data);

      const { token, user } = response.data;

      const role = user.role;

      // First set local storage directly to ensure it's available immediately
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("userData", JSON.stringify(user));

      console.log("Token Stored");

      // Then call onLogin (don't await it - this avoids waiting for state updates)
      onLogin(token, role, user);

      // Navigate after setting localStorage but don't wait for state updates
      navigate(
        `/dashboard/${
          role === "cs"
            ? "customer"
            : role === "pk"
            ? "office"
            : role === "tk"
            ? "field"
            : role === "ow"
            ? "owner"
            : "field"
        }`
      );
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      setError(
        err.response?.data?.error ||
          "Login failed. Please check your credentials."
      );
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "#2D1E5C",
        position: "fixed",
        top: 0,
        left: 0,
        padding: "20px",
      }}
    >
      <Container fluid>
        <Row className="justify-content-center">
          <Col
            xs={12}
            sm={9}
            md={7}
            lg={5}
            xl={4}
            className="mx-auto"
            style={{ maxWidth: "400px" }}
          >
            <Card
              style={{
                backgroundColor: "#624F82",
                borderRadius: "15px",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
              }}
            >
              <Card.Body className="p-4">
                <h2
                  className="text-center mb-4"
                  style={{
                    color: "#ffffff",
                    fontSize: "calc(1.4rem + 0.3vw)",
                  }}
                >
                  Login
                </h2>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label
                      style={{
                        color: "#ffffff",
                        fontSize: "calc(0.85rem + 0.1vw)",
                      }}
                    >
                      Email
                    </Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      placeholder="Enter email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      style={{
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e3e8ef",
                        padding: "10px",
                        fontSize: "calc(0.85rem + 0.1vw)",
                      }}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label
                      style={{
                        color: "#ffffff",
                        fontSize: "calc(0.85rem + 0.1vw)",
                      }}
                    >
                      Password
                    </Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      style={{
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e3e8ef",
                        padding: "10px",
                        fontSize: "calc(0.85rem + 0.1vw)",
                      }}
                    />
                  </Form.Group>
                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100 py-2 mt-2"
                    style={{
                      fontSize: "calc(0.85rem + 0.1vw)",
                      backgroundColor: "#95b8d1",
                      border: "none",
                    }}
                  >
                    Login
                  </Button>
                  <div
                    className="text-center mt-3"
                    style={{
                      fontSize: "calc(0.8rem + 0.1vw)",
                    }}
                  >
                    <span style={{ color: "#ffffff" }}>
                      Don't have an account?{" "}
                    </span>
                    <Link
                      to="/register"
                      style={{
                        color: "#95b8d1",
                        textDecoration: "none",
                        fontWeight: "500",
                      }}
                    >
                      Register here
                    </Link>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;
