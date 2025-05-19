import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Row,
  Col,
  Badge,
  Spinner,
  Alert,
  Form,
  Button,
  ListGroup,
  Modal, // Import Modal
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../Header";
import { StarFill } from "react-bootstrap-icons";

const StarRating = ({ rating, onRatingChange, disabled = false }) => {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div>
      {stars.map((star) => (
        <span
          key={star}
          onClick={() => !disabled && onRatingChange(star)}
          style={{
            cursor: disabled ? "default" : "pointer",
            color: star <= rating ? "#ffc107" : "#e4e5e9",
            fontSize: "1.5rem",
            marginRight: "3px",
          }}
        >
          <StarFill />
        </span>
      ))}
    </div>
  );
};

const TransactionDetail = ({ onLogout }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [transaction, setTransaction] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [assignedWorkers, setAssignedWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [comment, setComment] = useState("");
  const [ratings, setRatings] = useState({});
  const [hasRatedAll, setHasRatedAll] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false); // State for modal
  const [newScheduleDate, setNewScheduleDate] = useState("");
  const [newScheduleTime, setNewScheduleTime] = useState("");
  const [rescheduleError, setRescheduleError] = useState(null);
  const [rescheduleSuccess, setRescheduleSuccess] = useState(null);
  const [isRescheduling, setIsRescheduling] = useState(false);

  const userData = JSON.parse(localStorage.getItem("userData"));

  // Declare canGiveFeedback before it's used in useEffect
  const canGiveFeedback = transaction?.status === "done";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const transactionRes = await axios.get(
          `/api/transactions/${id}`,
          config
        );
        const fetchedTransaction = Array.isArray(transactionRes.data)
          ? transactionRes.data[0]
          : transactionRes.data;

        if (!fetchedTransaction) throw new Error("Transaction not found.");

        setTransaction(fetchedTransaction);
        setComment(fetchedTransaction.comments || "");

        if (fetchedTransaction?.transactionId) {
          const scheduleRes = await axios.get(
            `/api/schedules/transaction/${fetchedTransaction.transactionId}`,
            config
          );

          const fetchedSchedule = Array.isArray(scheduleRes.data)
            ? scheduleRes.data[0]
            : scheduleRes.data;

          if (fetchedSchedule) {
            setSchedule(fetchedSchedule);

            if (fetchedSchedule?.assignTo?.length > 0) {
              const workers = fetchedSchedule.assignTo.map((identifier) => ({
                identifier,
              }));
              setAssignedWorkers(workers);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Fetch ratings once assigned workers are available
  useEffect(() => {
    const fetchRatings = async () => {
      if (!transaction?._id || assignedWorkers.length === 0 || !userData?.id) {
        setRatings({});
        setHasRatedAll(false); // Default to false if prerequisites aren't met
        return;
      }

      try {
        const resultsRating = await Promise.all(
          assignedWorkers.map(async (worker) => {
            const workerId = worker.identifier._id;
            try {
              const response = await axios.get(
                // Ensure transaction._id is the correct ID for the rating context
                `/api/users/rating/${transaction._id}/${workerId}`
              );
              const data = response.data; // No need for 'await' here, axios already resolves
              return {
                workerId,
                rating: data.rating_number || 0,
                actualRaterUserId: data.user_id_rater || null, // Use the ID of the actual rater
              };
            } catch (error) {
              // Handle cases where a specific rating might not be found or an error occurs
              console.error(
                `Error fetching rating for worker ${workerId}:`,
                error
              );
              return {
                workerId,
                rating: 0,
                actualRaterUserId: null,
                error: true,
              };
            }
          })
        );

        const ratingsObject = {};
        let allActuallyRatedByThisUser = assignedWorkers.length > 0; // Assume true only if there are workers

        if (assignedWorkers.length === 0) {
          allActuallyRatedByThisUser = false; // No workers, so nothing rated by this user yet
        } else {
          for (const res of resultsRating) {
            ratingsObject[res.workerId] = res.rating;
            if (res.error) {
              // If there was an error fetching this rating
              allActuallyRatedByThisUser = false;
              break;
            }
            // If a rating for a worker is 0 (not rated) OR
            // if it was rated by someone else
            if (res.rating === 0 || res.actualRaterUserId !== userData.id) {
              allActuallyRatedByThisUser = false;
              break;
            }
          }
        }

        setRatings(ratingsObject);
        setHasRatedAll(allActuallyRatedByThisUser);
      } catch (err) {
        console.error("Failed to fetch ratings:", err);
        setRatings({}); // Reset ratings on general failure
        setHasRatedAll(false); // Default to allowing feedback if there's a general error
      }
    };

    // Only fetch ratings if feedback can potentially be given
    if (canGiveFeedback) {
      fetchRatings();
    } else {
      // If feedback cannot be given (e.g. transaction not "done"),
      // then effectively, the user has "rated all" in the sense that the option is unavailable.
      setHasRatedAll(true);
    }
  }, [assignedWorkers, transaction, userData?.id, canGiveFeedback]);

  const handleRatingChange = (workerId, ratingValue) => {
    setRatings((prev) => ({
      ...prev,
      [workerId]: ratingValue,
    }));
  };

  const handleCommentChange = (e) => {
    setComment(e.target.value);
  };

  const handleShowRescheduleModal = () => setShowRescheduleModal(true);
  const handleCloseRescheduleModal = () => {
    setShowRescheduleModal(false);
    setNewScheduleDate("");
    setNewScheduleTime("");
    setRescheduleError(null);
    setRescheduleSuccess(null);
  };

  const handleRescheduleSubmit = async () => {
    if (!newScheduleDate || !newScheduleTime) {
      setRescheduleError("New date and time are required.");
      return;
    }
    setIsRescheduling(true);
    setRescheduleError(null);
    setRescheduleSuccess(null);

    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Assuming 'schedule._id' is the ID of the schedule document
      if (!schedule?._id) {
        throw new Error("Schedule ID is missing.");
      }

      await axios.put(
        `/api/schedules/${schedule._id}`,
        {
          date: newScheduleDate,
          time: newScheduleTime,
          status: "pending", // Or whatever status is appropriate after rescheduling
        },
        config
      );

      setRescheduleSuccess("Schedule updated successfully!");
      // Optionally, refetch transaction/schedule data to show updated info
      // For now, just update the local state for immediate feedback
      setSchedule((prevSchedule) => ({
        ...prevSchedule,
        date: newScheduleDate,
        time: newScheduleTime,
      }));
      // Close modal after a short delay to show success message
      setTimeout(() => {
        handleCloseRescheduleModal();
      }, 2000);
    } catch (err) {
      console.error("Error rescheduling:", err);
      setRescheduleError(
        err.response?.data?.message || "Failed to reschedule. Please try again."
      );
    } finally {
      setIsRescheduling(false);
    }
  };

  const handleSubmitFeedback = async () => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (comment !== (transaction?.comments || "") && transaction?._id) {
        await axios.put(
          `/api/transactions/${transaction._id}`,
          { comments: comment },
          config
        );
      }

      const customerId = userData.id;
      const transactionId = transaction?._id;
      const ratingEntries = Object.entries(ratings);

      const promises = ratingEntries
        .filter(([_, ratingValue]) => ratingValue >= 1 && ratingValue <= 5)
        .map(([ratedUserId, ratingValue]) =>
          axios.put(
            `/api/users/${ratedUserId}/rating`,
            {
              transaction_id: transactionId,
              user_id: customerId,
              rating_number: ratingValue,
            },
            config
          )
        );

      if (promises.length === 0) {
        setSuccess("No changes detected to submit.");
        return;
      }

      await Promise.all(promises);

      setSuccess("Feedback submitted successfully!");
    } catch (err) {
      console.error("Error submitting feedback:", err);
      setError(
        err.response?.data?.message ||
          "Failed to submit feedback. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const formatRupiah = (price) => {
    if (price === undefined || price === null) return "Rp N/A";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <>
        <Header userData={userData} onLogout={onLogout} />
        <Container className="py-5 text-center">
          <Spinner animation="border" role="status" />
        </Container>
      </>
    );
  }

  if (error && !transaction) {
    return (
      <>
        <Header userData={userData} onLogout={onLogout} />
        <Container className="py-5">
          <Alert variant="danger">{error}</Alert>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Back
          </Button>
        </Container>
      </>
    );
  }

  return (
    <>
      <Header userData={userData} onLogout={onLogout} />
      <Container className="py-4">
        <Card className="mb-4 shadow-sm">
          <Card.Header className="bg-light">
            <h4 className="m-0">Transaction Details</h4>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <p>
                  <strong>Transaction ID:</strong>{" "}
                  {transaction.transactionId || "N/A"}
                </p>
                <p>
                  <strong>Date:</strong> {formatDate(transaction.date)}
                </p>
                <p>
                  <strong>Status:</strong>
                  <Badge
                    bg={transaction.status === "done" ? "success" : "warning"}
                    className="ms-2"
                  >
                    {transaction.status}
                  </Badge>
                </p>
              </Col>
              <Col md={6}>
                <p>
                  <strong>Customer:</strong> {transaction.user || "N/A"}
                </p>
                <p>
                  <strong>Location:</strong> {transaction.location || "N/A"}
                </p>
                <p>
                  <strong>Total Amount:</strong>{" "}
                  {formatRupiah(transaction.totalPrice)}
                </p>
              </Col>
            </Row>
            <hr />
            <h6>Items Purchased:</h6>
            {transaction.products && transaction.qty && transaction.prices ? (
              <ListGroup variant="flush">
                {transaction.products.map((productName, index) => (
                  <ListGroup.Item
                    key={index}
                    className="d-flex justify-content-between"
                  >
                    <span>
                      {productName} (Qty: {transaction.qty[index]})
                    </span>
                    <span>
                      {formatRupiah(
                        transaction.prices[index] * transaction.qty[index]
                      )}
                    </span>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            ) : (
              <p className="text-muted">Item details not available.</p>
            )}
          </Card.Body>
        </Card>

        {schedule && (
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="m-0">Installation Schedule</h5>
            </Card.Header>
            <Card.Body>
              <Row className="align-items-center">
                <Col>
                  <p className="mb-1">
                    <strong>Scheduled Date:</strong> {formatDate(schedule.date)}
                  </p>
                  <p className="mb-0">
                    <strong>Scheduled Time:</strong>{" "}
                    {schedule.time || "Not set"}
                  </p>
                </Col>
                {schedule.date &&
                  schedule.time &&
                  schedule.status === "pending" && (
                    <Col xs="auto">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={handleShowRescheduleModal} // Open modal
                      >
                        Reschedule
                      </Button>
                    </Col>
                  )}
              </Row>
              <p className="mt-2">
                <strong>Status:</strong>
                <Badge
                  bg={schedule.status === "done" ? "success" : "warning"}
                  className="ms-2"
                >
                  {schedule.status}
                </Badge>
              </p>
              <h6>Assigned Workers:</h6>
              {assignedWorkers.length > 0 ? (
                <ListGroup variant="flush">
                  {assignedWorkers.map((worker) => (
                    <ListGroup.Item key={worker.identifier._id}>
                      {worker.identifier.name}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <p className="text-muted">No workers assigned yet.</p>
              )}
            </Card.Body>
          </Card>
        )}

        {canGiveFeedback && assignedWorkers.length > 0 && (
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="m-0">Provide Feedback</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={(e) => e.preventDefault()}>
                <Form.Group className="mb-4">
                  <Form.Label as="h6">Rate Field Workers:</Form.Label>
                  {assignedWorkers.map((worker) => (
                    <div key={worker.identifier._id} className="mb-3">
                      <Form.Label>{worker.identifier.name}</Form.Label>
                      <StarRating
                        rating={ratings[worker.identifier._id] || 0}
                        onRatingChange={(ratingValue) =>
                          handleRatingChange(worker.identifier._id, ratingValue)
                        }
                        disabled={submitting}
                      />
                    </div>
                  ))}
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label as="h6">Comments:</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    placeholder="Share your experience with the service..."
                    value={comment}
                    onChange={handleCommentChange}
                    disabled={submitting}
                  />
                </Form.Group>
                {!hasRatedAll && (
                  <div className="d-flex justify-content-end">
                    <Button
                      variant="primary"
                      onClick={handleSubmitFeedback}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                          />
                          <span className="ms-2">Submitting...</span>
                        </>
                      ) : (
                        "Submit Feedback"
                      )}
                    </Button>
                  </div>
                )}
              </Form>
              <div style={{ marginTop: "20px" }}>
                {error && <Alert variant="warning">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}
              </div>
            </Card.Body>
          </Card>
        )}

        <Button variant="outline-secondary" onClick={() => navigate(-1)}>
          &laquo; Back to Dashboard
        </Button>

        {/* Reschedule Modal */}
        <Modal show={showRescheduleModal} onHide={handleCloseRescheduleModal}>
          <Modal.Header closeButton>
            <Modal.Title>Reschedule Installation</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {rescheduleError && (
              <Alert variant="danger">{rescheduleError}</Alert>
            )}
            {rescheduleSuccess && (
              <Alert variant="success">{rescheduleSuccess}</Alert>
            )}
            <p>Transaction ID: {transaction?.transactionId}</p>
            <p>Current Date: {formatDate(schedule?.date)}</p>
            <p>Current Time: {schedule?.time || "Not set"}</p>
            <Form>
              <Form.Group className="mb-3" controlId="formRescheduleDate">
                <Form.Label>New Date</Form.Label>
                <Form.Control
                  type="date"
                  value={newScheduleDate}
                  onChange={(e) => setNewScheduleDate(e.target.value)}
                  disabled={isRescheduling}
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formRescheduleTime">
                <Form.Label>New Time</Form.Label>
                <Form.Control
                  type="time"
                  value={newScheduleTime}
                  onChange={(e) => setNewScheduleTime(e.target.value)}
                  disabled={isRescheduling}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={handleCloseRescheduleModal}
              disabled={isRescheduling}
            >
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handleRescheduleSubmit}
              disabled={isRescheduling}
            >
              {isRescheduling ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                  />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </>
  );
};

export default TransactionDetail;
