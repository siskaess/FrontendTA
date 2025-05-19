import React, { useState } from "react";
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

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
    kode_pos: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const { name, email, password, confirmPassword, address, kode_pos } = formData;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!/^\d{5}$/.test(kode_pos)) {
      setError("Invalid Postal Code. Must be 5 digits.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3000/api/auth/register",
        {
          name,
          email,
          password,
          address,
          kode_pos,
        }
      );

      if (response.status === 201) {
        alert("Registration successful!");
        navigate("/login");
      }
    } catch (err) {
      setError(
        err.response?.data?.error || "Registration failed. Please try again."
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
        position: "absolute",
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
                border: "none",
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
                  Register
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
                      Name
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      placeholder="Enter your name"
                      value={name}
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
                      Email
                    </Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      placeholder="Enter email"
                      value={email}
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
                      value={password}
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
                      Confirm Password
                    </Form.Label>
                    <Form.Control
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm password"
                      value={confirmPassword}
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
                      Address
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="address"
                      placeholder="Enter your address"
                      value={address}
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
                      Postal Code
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="kode_pos"
                      placeholder="Enter postal code"
                      value={kode_pos}
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
                    Register
                  </Button>
                  <div
                    className="text-center mt-3"
                    style={{
                      fontSize: "calc(0.8rem + 0.1vw)",
                    }}
                  >
                    <span style={{ color: "#ffffff" }}>
                      Already have an account?{" "}
                    </span>
                    <Link
                      to="/login"
                      style={{
                        color: "#95b8d1",
                        textDecoration: "none",
                        fontWeight: "500",
                      }}
                    >
                      Login here
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

export default Register;
