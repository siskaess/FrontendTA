import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Button,
  Row,
  Col,
  Table,
  Badge,
  Spinner,
  Alert,
  Modal, // Import Modal
  Form, // Import Form
} from "react-bootstrap";
import Header from "../Header";
import axios from "axios";
import { Link } from "react-router-dom"; // Import Link

const FieldWorkerDashboard = ({ userData, onLogout }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for the report modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);
  const [reportImage, setReportImage] = useState(null);
  const [reportAdditionalInfo, setReportAdditionalInfo] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    const fetchWorkerSchedules = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `/api/schedules/worker/${userData.email}`
        );
        setSchedules(response.data);
        setError(null);
      } catch (err) {
        setError("Failed to load your schedule. Please try again later.");
        console.error("Error fetching schedules:", err);
      } finally {
        setLoading(false);
      }
    };

    if (userData && userData.email) {
      fetchWorkerSchedules();
    }
  }, [userData]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge bg="warning">Pending</Badge>;
      case "done":
        return <Badge bg="success">Done</Badge>;
      default:
        return <Badge bg="secondary">Unknown</Badge>;
    }
  };

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const countSchedulesByStatus = (status) => {
    return schedules.filter((schedule) => schedule.status === status).length;
  };

  const handleOpenReportModal = (scheduleId) => {
    setSelectedScheduleId(scheduleId);
    setShowReportModal(true);
    setReportImage(null);
    setReportAdditionalInfo("");
    setError(null); // Clear previous errors
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
    setSelectedScheduleId(null);
    setReportImage(null);
    setReportAdditionalInfo("");
    setSubmittingReport(false);
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!selectedScheduleId || !reportImage) {
      setError("Image is required to submit the report.");
      return;
    }

    setSubmittingReport(true);
    setError(null);

    const formData = new FormData();
    formData.append("scheduleId", selectedScheduleId);
    formData.append("image", reportImage);
    formData.append("additionalInfo", reportAdditionalInfo);

    try {
      const response = await axios.post("/api/schedules/report", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Update local state with the schedule returned from the backend (which includes the new status and report info)
      setSchedules((prevSchedules) =>
        prevSchedules.map((schedule) =>
          schedule._id === selectedScheduleId ? response.data : schedule
        )
      );
      handleCloseReportModal();
    } catch (err) {
      setError("Failed to submit report. Please try again.");
      console.error("Error submitting report:", err);
      setSubmittingReport(false); // Keep modal open on error if desired, or close
    }
  };

  return (
    <>
      <Header userData={userData} onLogout={onLogout} />
      <Container fluid className="p-0">
        {/* Welcome Section */}
        <Container className="py-4">
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Body>
              <h5>Welcome, {userData.name || userData.email}</h5>
              <p className="text-muted">
                View and manage your assigned schedules and service tasks.
              </p>
            </Card.Body>
          </Card>

          {error && !showReportModal && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}

          {/* Main Content */}
          <Row>
            {/* Schedule List */}
            <Col md={8} className="mb-4">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Header className="bg-white">
                  <h5 className="m-0">My Schedule</h5>
                </Card.Header>
                <Card.Body>
                  {loading ? (
                    <div className="text-center py-4">
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-2">Loading your schedule...</p>
                    </div>
                  ) : error ? (
                    <Alert variant="danger">{error}</Alert>
                  ) : schedules.length === 0 ? (
                    <Alert variant="info">
                      No schedules assigned to you at the moment.
                    </Alert>
                  ) : (
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Customer</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schedules.map((schedule) => (
                          <tr key={schedule._id}>
                            <td>{formatDate(schedule.date)}</td>
                            <td>{schedule.time}</td>
                            <td>{schedule.customer}</td>
                            <td>{getStatusBadge(schedule.status)}</td>
                            <td>
                              <Link to={`/schedules/detail/${schedule._id}`}>
                                <Button
                                  size="sm"
                                  variant="outline-info"
                                  className="me-2"
                                >
                                  View
                                </Button>
                              </Link>
                              {schedule.status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="outline-success"
                                  onClick={() =>
                                    handleOpenReportModal(schedule._id)
                                  }
                                >
                                  Confirm & Report
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
            </Col>

            {/* Summary / Stats */}
            <Col md={4} className="mb-4">
              <Card className="mb-4 border-0 shadow-sm">
                <Card.Header className="bg-white">
                  <h5 className="m-0">Schedule Summary</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex justify-content-between mb-3">
                    <span>Pending Tasks:</span>
                    <span className="fw-bold">
                      {countSchedulesByStatus("pending")}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-4">
                    <span>Completed Tasks:</span>
                    <span className="fw-bold">
                      {countSchedulesByStatus("done")}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-4">
                    <span>Total Assigned:</span>
                    <span className="fw-bold">{schedules.length}</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </Container>

      {/* Report Submission Modal */}
      <Modal show={showReportModal} onHide={handleCloseReportModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Submit Installation Report</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleReportSubmit}>
            <Form.Group controlId="formReportImage" className="mb-3">
              <Form.Label>Installation Image</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={(e) => setReportImage(e.target.files[0])}
                required
              />
            </Form.Group>

            <Form.Group controlId="formReportAdditionalInfo" className="mb-3">
              <Form.Label>Additional Information (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={reportAdditionalInfo}
                onChange={(e) => setReportAdditionalInfo(e.target.value)}
              />
            </Form.Group>

            <Button
              variant="primary"
              type="submit"
              disabled={submittingReport || !reportImage}
              className="w-100"
            >
              {submittingReport ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default FieldWorkerDashboard;
