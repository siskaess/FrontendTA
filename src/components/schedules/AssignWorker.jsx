import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Form,
  Button,
  Spinner,
  Alert,
  ListGroup,
  Row,
  Col,
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../Header";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const AssignWorker = ({ userData, onLogout }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState(null);
  const [workers, setWorkers] = useState([]); // Expects array of { _id: string, name: string }
  const [selectedWorkerIds, setSelectedWorkerIds] = useState([]); // Stores worker IDs
  const [loading, setLoading] = useState(true);
  const [workersLoading, setWorkersLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [scheduleDate, setScheduleDate] = useState(null);
  const [scheduleTime, setScheduleTime] = useState(""); // Will store HH:MM for submission
  const [selectedHour, setSelectedHour] = useState("09"); // Default hour
  const [selectedMinute, setSelectedMinute] = useState("00"); // Default minute (00, 10, 20, etc.)
  const [scheduleStatus, setScheduleStatus] = useState("pending");
  const [scheduleLocation, setScheduleLocation] = useState("");

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(`/api/schedules/id/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSchedule(response.data);

        console.log("Fetched schedule:", response.data);

        setScheduleDate(
          response.data.date ? new Date(response.data.date) : null
        );
        setScheduleStatus(response.data.status || "pending");
        setScheduleLocation(response.data.location || "");

        if (response.data.time) {
          const [h, m] = response.data.time.split(":");
          if (h) setSelectedHour(h.padStart(2, "0"));
          if (m) {
            const numMinute = parseInt(m, 10);
            if (!isNaN(numMinute)) {
              // Round down to the nearest 10 for the picker
              const roundedMinuteVal = Math.floor(numMinute / 10) * 10;
              setSelectedMinute(String(roundedMinuteVal).padStart(2, "0"));
            } else {
              setSelectedMinute("00"); // Default if minute part is invalid
            }
          }
        } else {
          // If no time from backend, defaults from useState are used for selectedHour and selectedMinute
          setSelectedHour("09");
          setSelectedMinute("00");
        }
        // Initial population of selectedWorkerIds is handled by the useEffect below
        setError(null);
      } catch (err) {
        console.error("Error fetching schedule:", err);
        setError("Failed to load schedule details. Please try again.");
        setSchedule(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [id]);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        setWorkersLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(`/api/users/fieldworkers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Available workers:", response.data);
        if (Array.isArray(response.data)) {
          setWorkers(response.data);
        } else {
          console.warn(
            "API response for workers is not an array:",
            response.data
          );
          setWorkers([]);
        }
      } catch (err) {
        console.error("Error fetching workers:", err);
        setWorkers([]);
      } finally {
        setWorkersLoading(false);
      }
    };
    fetchWorkers();
  }, []);

  // Effect to combine selectedHour and selectedMinute into scheduleTime
  useEffect(() => {
    if (selectedHour && selectedMinute) {
      setScheduleTime(`${selectedHour}:${selectedMinute}`);
    }
  }, [selectedHour, selectedMinute]);

  // Effect to initialize selectedWorkerIds once schedule and workers are loaded
  useEffect(() => {
    if (schedule && schedule.assignTo && workers.length > 0) {
      const initialSelectedIds = schedule.assignTo
        .map((assignedItem) => {
          // Case 1: assignedItem is already a worker ID string and exists in workers list
          if (
            typeof assignedItem === "string" &&
            workers.some((w) => w._id === assignedItem)
          ) {
            return assignedItem;
          }
          // Case 2: assignedItem is a worker object with an _id property and exists in workers list
          if (
            typeof assignedItem === "object" &&
            assignedItem._id &&
            workers.some((w) => w._id === assignedItem._id)
          ) {
            return assignedItem._id;
          }
          // Case 3: assignedItem is a worker name string, find its ID from the fetched workers list
          if (typeof assignedItem === "string") {
            const worker = workers.find((w) => w.name === assignedItem);
            return worker ? worker._id : null;
          }
          return null;
        })
        .filter(Boolean); // Remove nulls if mapping failed (e.g., name not found, or item was not string/object with _id)
      setSelectedWorkerIds(initialSelectedIds);
      console.log("Initialized selectedWorkerIds:", initialSelectedIds);
    } else if (
      schedule &&
      (!schedule.assignTo || schedule.assignTo.length === 0)
    ) {
      // If schedule is loaded but assignTo is empty or not present, ensure selectedWorkerIds is empty
      setSelectedWorkerIds([]);
    }
  }, [schedule, workers]);

  const handleWorkerSelection = (workerId) => {
    setSelectedWorkerIds((prevIds) => {
      const currentSelection = Array.isArray(prevIds) ? prevIds : [];
      if (currentSelection.includes(workerId)) {
        return currentSelection.filter((id) => id !== workerId);
      } else {
        return [...currentSelection, workerId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!scheduleDate) {
      setError("Please select a date for the schedule.");
      return;
    }
    if (
      !scheduleTime ||
      !scheduleTime.trim() ||
      !/^\d{2}:\d{2}$/.test(scheduleTime)
    ) {
      setError("Please select a valid time for the schedule.");
      return;
    }

    try {
      setSubmitting(true);

      const assignedWorkersPayload = selectedWorkerIds
        .map((workerId) => {
          const worker = workers.find((w) => w._id === workerId);
          return worker ? { _id: worker._id, name: worker.name } : null;
        })
        .filter(Boolean); // Filter out any nulls if a worker wasn't found (should not happen if selection is proper)

      const payload = {
        date: scheduleDate,
        time: scheduleTime,
        status: scheduleStatus,
        assignTo: assignedWorkersPayload, // Send array of objects
      };

      console.log("Updating schedule with payload:", payload);

      const token = localStorage.getItem("token");
      await axios.put(`/api/schedules/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess(true);

      setTimeout(() => {
        navigate(`/schedules/detail/${id}`); // Or back to schedules list
      }, 1500);
    } catch (err) {
      console.error(
        "Error updating schedule:",
        err.response?.data || err.message
      );
      setError(
        err.response?.data?.message ||
          "Failed to update schedule. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
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

  if (!schedule) {
    return (
      <>
        <Header userData={userData} onLogout={onLogout} />
        <Container className="py-5">
          <Alert variant="warning">
            {error || "Schedule not found or failed to load."}
          </Alert>
          <Button
            variant="secondary"
            onClick={() => navigate("/office-dashboard")}
          >
            Back to Dashboard
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
          <Card.Header className="bg-white">
            <h5 className="m-0">Update Schedule Details</h5>
          </Card.Header>

          <Card.Body>
            {error && (
              <Alert
                variant="danger"
                onClose={() => setError(null)}
                dismissible
              >
                {error}
              </Alert>
            )}
            {success && (
              <Alert variant="success">Schedule updated successfully!</Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <Row className="mb-3">
                <Form.Group as={Col} md={6} controlId="formCustomerName">
                  <Form.Label>Customer Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={schedule.customer || ""} // Assuming schedule.customer is email, consider fetching name
                    disabled
                    readOnly
                  />
                </Form.Group>
                <Form.Group as={Col} md={6} controlId="formLocation">
                  <Form.Label>Location</Form.Label>
                  <Form.Control
                    type="text"
                    value={scheduleLocation}
                    disabled
                    readOnly
                  />
                </Form.Group>
              </Row>
              <Row className="mb-3">
                <Form.Group as={Col} md={4} controlId="formScheduleDate">
                  <Form.Label>Date</Form.Label>
                  <br />
                  <DatePicker
                    selected={scheduleDate}
                    onChange={(date) => setScheduleDate(date)}
                    className="form-control"
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Select date"
                    required
                  />
                </Form.Group>
                <Form.Group as={Col} md={4} controlId="formScheduleTime">
                  <Form.Label>Time</Form.Label>
                  <Row>
                    <Col xs={6} sm={6}>
                      <Form.Select
                        value={selectedHour}
                        onChange={(e) => setSelectedHour(e.target.value)}
                        aria-label="Select hour"
                      >
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = String(i).padStart(2, "0");
                          return (
                            <option key={hour} value={hour}>
                              {hour}
                            </option>
                          );
                        })}
                      </Form.Select>
                    </Col>
                    <Col xs={6} sm={6}>
                      <Form.Select
                        value={selectedMinute}
                        onChange={(e) => setSelectedMinute(e.target.value)}
                        aria-label="Select minute"
                      >
                        {["00", "10", "20", "30", "40", "50"].map((minute) => (
                          <option key={minute} value={minute}>
                            {minute}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                  </Row>
                </Form.Group>
                <Form.Group as={Col} md={4} controlId="formScheduleStatus">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={scheduleStatus}
                    onChange={(e) => setScheduleStatus(e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="done">Done</option>
                  </Form.Select>
                </Form.Group>
              </Row>

              <Form.Group className="mb-4">
                <Form.Label>Assign Workers</Form.Label>

                {workersLoading ? (
                  <div className="text-center py-3">
                    <Spinner animation="border" size="sm" />
                    <span className="ms-2">Loading available workers...</span>
                  </div>
                ) : Array.isArray(workers) && workers.length > 0 ? (
                  <div
                    className="mb-3 p-3 border rounded"
                    style={{ maxHeight: "200px", overflowY: "auto" }}
                  >
                    {workers.map((worker) => (
                      <Form.Check
                        key={worker._id}
                        type="checkbox"
                        id={`worker-${worker._id}`}
                        label={worker.name}
                        checked={selectedWorkerIds.includes(worker._id)}
                        onChange={() => handleWorkerSelection(worker._id)}
                        className="mb-2"
                      />
                    ))}
                  </div>
                ) : (
                  <Alert variant="info" className="mb-3">
                    {workersLoading
                      ? "Loading..."
                      : "No pre-defined workers found. You can add workers manually below."}
                  </Alert>
                )}

                <div className="mt-3">
                  <strong>Selected Workers:</strong>
                  {selectedWorkerIds.length === 0 ? (
                    <span className="ms-2 text-muted">No workers selected</span>
                  ) : (
                    <ListGroup className="mt-2">
                      {selectedWorkerIds.map((workerId) => {
                        const worker = workers.find((w) => w._id === workerId);
                        return (
                          <ListGroup.Item
                            key={workerId}
                            className="d-flex justify-content-between align-items-center py-1 px-2"
                          >
                            {worker
                              ? worker.name
                              : `ID: ${workerId} (Name not found)`}
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() =>
                                setSelectedWorkerIds((prevIds) =>
                                  (Array.isArray(prevIds)
                                    ? prevIds
                                    : []
                                  ).filter((id) => id !== workerId)
                                )
                              }
                            >
                              &times;
                            </Button>
                          </ListGroup.Item>
                        );
                      })}
                    </ListGroup>
                  )}
                </div>
              </Form.Group>

              <div className="d-flex justify-content-between mt-4">
                <Button variant="secondary" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                      />
                      <span className="ms-2">Saving...</span>
                    </>
                  ) : (
                    "Update Schedule"
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </>
  );
};

export default AssignWorker;
