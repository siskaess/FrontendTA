import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Row,
  Col,
  Badge,
  Button,
  Spinner,
  Alert,
  Table,
} from "react-bootstrap";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../Header";

const ScheduleDetail = ({ userData, onLogout }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState(null);
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token"); // <-- Add this line
        const response = await axios.get(`/api/schedules/id/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSchedule(response.data);
        setError(null);

        // If schedule has a transaction ID, fetch the transaction data
        if (response.data.transaction) {
          fetchTransaction(response.data.transaction);
        }
      } catch (err) {
        console.error("Error fetching schedule:", err);
        setError("Failed to load schedule details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [id]);

  const fetchTransaction = async (transactionId) => {
    try {
      setTransactionLoading(true);

      const token = localStorage.getItem("token");
      const response = await axios.get(`/api/transactions/${transactionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // console.log("response", response);

      // Just set the transaction and don't try to log it immediately
      if (response.data == null) {
        console.log("Data not found");
      } else {
        setTransaction(response.data[0]);
        console.log(transaction, response.data);
      }

      // If you need to log the response data, do it directly:
      console.log("Transaction data:", response.data);
    } catch (err) {
      console.error("Error fetching transaction:", err);
      // Don't set an error for transaction - just don't show the data
    } finally {
      setTransactionLoading(false);
    }
  };

  const handleConfirmSchedule = async () => {
    try {
      setConfirmLoading(true);
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/schedules/${id}/confirm`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSchedule((prev) => ({ ...prev, status: "done" }));
      setError(null);
    } catch (err) {
      console.error("Error confirming schedule:", err);
      setError("Failed to confirm schedule. Please try again.");
    } finally {
      setConfirmLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const options = { year: "numeric", month: "long", day: "numeric" };
      return new Date(dateString).toLocaleDateString("en-US", options);
    } catch (error) {
      console.error("Date formatting error:", error);
      return dateString;
    }
  };

  const renderAssignedTo = (assignToArray) => {
    if (!assignToArray || assignToArray.length === 0) {
      return "Unassigned";
    }

    return assignToArray.map((worker) => worker.name).join(", ");
  };

  const isAssignable = (schedule) => {
    return (
      schedule.status === "pending" &&
      (!schedule.assignTo || schedule.assignTo.length === 0)
    );
  };

  if (loading) {
    return (
      <>
        <Header userData={userData} onLogout={onLogout} />
        <Container className="py-5 text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </Container>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header userData={userData} onLogout={onLogout} />
        <Container className="py-5">
          <Alert variant="danger">{error}</Alert>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </Container>
      </>
    );
  }

  if (!schedule) {
    return (
      <>
        <Header userData={userData} onLogout={onLogout} />
        <Container className="py-5">
          <Alert variant="warning">Schedule not found</Alert>
          <Button variant="secondary" onClick={() => navigate("/schedules")}>
            Back to Schedules
          </Button>
        </Container>
      </>
    );
  }

  return (
    <>
      <Header userData={userData} onLogout={onLogout} />
      <Container className="py-4">
        <Card className="border-0 shadow-sm mb-4">
          <Card.Header className="bg-white d-flex justify-content-between align-items-center">
            <h5 className="m-0">Schedule Details</h5>
            <div>
              <Button
                variant="secondary"
                className="me-2"
                onClick={() => navigate(-1)}
              >
                Back
              </Button>
              {schedule.status === "pending" && (
                <>
                  {isAssignable(schedule) && (
                    <Link to={`/schedules/edit/${schedule._id || schedule.id}`}>
                      <Button variant="primary" className="me-2">
                        Assign Worker
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="success"
                    onClick={handleConfirmSchedule}
                    disabled={confirmLoading}
                  >
                    {confirmLoading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                        />
                        <span className="ms-2">Processing</span>
                      </>
                    ) : (
                      "Confirm Schedule"
                    )}
                  </Button>
                </>
              )}
            </div>
          </Card.Header>

          <Card.Body>
            <Row>
              <Col md={6}>
                <h6 className="text-muted mb-3">Schedule Information</h6>
                <Table bordered hover>
                  <tbody>
                    <tr>
                      <td className="fw-bold" width="40%">
                        Status
                      </td>
                      <td>
                        <Badge
                          bg={
                            schedule.status === "done" ? "success" : "warning"
                          }
                        >
                          {schedule.status}
                        </Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Customer</td>
                      <td>{schedule.customer || "N/A"}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Date</td>
                      <td>{formatDate(schedule.date)}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Time</td>
                      <td>{schedule.time || "Not specified"}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Assigned Worker(s)</td>
                      <td>{renderAssignedTo(schedule.assignTo)}</td>
                    </tr>
                    {schedule.transaction && (
                      <tr>
                        <td className="fw-bold">Transaction ID</td>
                        <td>
                          <Link to={`/payments/detail/${schedule.transaction}`}>
                            {schedule.transaction}
                          </Link>
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td className="fw-bold">Image</td>
                      <td>
                        {schedule.report ? (
                          <img
                            src={schedule.report}
                            alt="Schedule"
                            style={{
                              maxWidth: "200px",
                              maxHeight: "200px",
                              objectFit: "contain",
                            }}
                          />
                        ) : (
                          <span>No image available</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
              <Col md={6}>
                <h6 className="text-muted mb-3">Transaction Information</h6>
                <Card className="h-80">
                  <Card.Body
                    className="overflow-auto"
                    style={{ maxHeight: "500px" }}
                  >
                    {schedule.transaction ? (
                      transactionLoading ? (
                        <div className="text-center py-4">
                          <Spinner animation="border" size="sm" />
                          <p className="mt-2">Loading transaction details...</p>
                        </div>
                      ) : transaction ? (
                        <>
                          <h6 className="mb-3">Customer Location</h6>
                          <p className="text-break">
                            {transaction.location || "No location specified"}
                          </p>

                          {transaction.products &&
                            transaction.products.length > 0 && (
                              <div className="mt-4">
                                <h6 className="mb-3">Purchased Products</h6>
                                <div className="table-responsive">
                                  <Table size="sm" striped>
                                    <thead>
                                      <tr>
                                        <th>Product</th>
                                        <th>Quantity</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {transaction.products.map(
                                        (product, idx) => (
                                          <tr key={idx}>
                                            <td className="text-break">
                                              {product}
                                            </td>
                                            <td>{transaction.qty[idx] || 1}</td>
                                          </tr>
                                        )
                                      )}
                                    </tbody>
                                  </Table>
                                </div>
                              </div>
                            )}

                          {transaction.totalPrice && (
                            <div className="mt-4">
                              <h6>Total Price</h6>
                              <p>
                                Rp {transaction.totalPrice.toLocaleString()}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <Alert variant="info">
                          Transaction details not available.
                        </Alert>
                      )
                    ) : (
                      <Alert variant="info">
                        No associated transaction for this schedule.
                      </Alert>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Container>
    </>
  );
};

export default ScheduleDetail;
