import React, { useState, useRef, useEffect } from "react";
import {
  Navbar,
  Container,
  Button,
  Overlay,
  Popover,
  Badge,
  Dropdown,
  Spinner,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  CartFill,
  PersonCircle,
  BellFill,
  BoxArrowInRight,
} from "react-bootstrap-icons";
import { useCart } from "../context/CartContext";
import axios from "axios";

const Header = ({ userData, onLogout, isAuthenticated = !!userData }) => {
  const navigate = useNavigate();
  const [showPopover, setShowPopover] = useState(false);
  const targetRef = useRef(null);
  const { cartItemsCount } = useCart();

  const [pendingSchedules, setPendingSchedules] = useState([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [schedulesError, setSchedulesError] = useState(null);

  const userRole = isAuthenticated ? userData?.role : null;
  const userInitial =
    isAuthenticated && userData?.email ? userData.email[0].toUpperCase() : "?";
  const isCustomer = isAuthenticated && userRole === "cs";
  const isFieldWorker = isAuthenticated && userRole === "pl";

  // Get the user's profile image
  const userProfileImage = userData?.profileImage || null;

  useEffect(() => {
    if (isAuthenticated && isFieldWorker && userData?.email) {
      const fetchPendingSchedules = async () => {
        setSchedulesLoading(true);
        setSchedulesError(null);
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `/api/schedules/worker/${userData.email}?status=pending`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setPendingSchedules(
            Array.isArray(response.data) ? response.data : []
          );
        } catch (err) {
          console.error("Error fetching pending schedules:", err);
          setSchedulesError("Failed to load notifications.");
          setPendingSchedules([]);
        } finally {
          setSchedulesLoading(false);
        }
      };
      fetchPendingSchedules();
    } else {
      setPendingSchedules([]);
    }
  }, [isAuthenticated, isFieldWorker, userData?.email]);

  const handleLogout = () => {
    if (typeof onLogout === "function") {
      onLogout();
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("userData");
      if (axios.defaults) {
        delete axios.defaults.headers.common["Authorization"];
      }
    }
    setShowPopover(false);
    navigate("/login");
  };

  const handleEditProfile = () => {
    setShowPopover(false);
    navigate("/profile/edit");
  };

  const handleLoginClick = () => {
    navigate("/login");
  };

  const togglePopover = () => setShowPopover(!showPopover);

  const formatDate = (dateString) => {
    if (!dateString) return "No date";
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      return "Invalid date";
    }
  };

  const handleScheduleClick = (scheduleId) => {
    navigate(`/schedules/detail/${scheduleId}`);
  };

  return (
    <Navbar style={{ backgroundColor: "#624F82" }} variant="dark" expand="lg">
      <Container>
        <Navbar.Brand
          as="div"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          CV. Matanova Security Technology
        </Navbar.Brand>

        <Navbar.Toggle />

        <Navbar.Collapse className="justify-content-end">
          {isAuthenticated ? (
            <div className="d-flex align-items-center gap-3">
              {isCustomer && (
                <div
                  style={{ cursor: "pointer", position: "relative" }}
                  onClick={() => navigate("/cart")}
                  className="d-flex align-items-center"
                >
                  <CartFill size={22} color="white" />
                  {cartItemsCount > 0 && (
                    <Badge
                      bg="danger"
                      pill
                      style={{
                        position: "absolute",
                        top: "-8px",
                        right: "-8px",
                        fontSize: "0.6rem",
                      }}
                    >
                      {cartItemsCount}
                    </Badge>
                  )}
                </div>
              )}

              {isFieldWorker && (
                <Dropdown align="end">
                  <Dropdown.Toggle
                    variant="link"
                    id="dropdown-notifications"
                    className="p-0 border-0 position-relative"
                    style={{ textDecoration: "none" }}
                  >
                    <BellFill size={22} color="white" />
                    {pendingSchedules.length > 0 && (
                      <Badge
                        bg="danger"
                        pill
                        style={{
                          position: "absolute",
                          top: "-5px",
                          right: "-5px",
                          fontSize: "0.6rem",
                        }}
                      >
                        {pendingSchedules.length}
                      </Badge>
                    )}
                  </Dropdown.Toggle>
                  <Dropdown.Menu
                    style={{
                      minWidth: "300px",
                      maxHeight: "400px",
                      overflowY: "auto",
                    }}
                  >
                    <Dropdown.Header>Pending Schedules</Dropdown.Header>
                    {schedulesLoading ? (
                      <div className="text-center p-2">
                        <Spinner animation="border" size="sm" /> Loading...
                      </div>
                    ) : schedulesError ? (
                      <Dropdown.ItemText className="text-danger px-3 py-2">
                        {schedulesError}
                      </Dropdown.ItemText>
                    ) : pendingSchedules.length === 0 ? (
                      <Dropdown.ItemText className="text-muted px-3 py-2">
                        No pending schedules.
                      </Dropdown.ItemText>
                    ) : (
                      pendingSchedules.map((schedule) => (
                        <Dropdown.Item
                          key={schedule._id}
                          onClick={() => handleScheduleClick(schedule._id)}
                          className="py-2"
                        >
                          <div className="fw-bold">
                            {schedule.customer || "No Customer"}
                          </div>
                          <small className="text-muted">
                            {schedule.location || "No Location"} -{" "}
                            {formatDate(schedule.date)}
                          </small>
                        </Dropdown.Item>
                      ))
                    )}
                  </Dropdown.Menu>
                </Dropdown>
              )}
              <div
                ref={targetRef}
                onClick={togglePopover}
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  overflow: "hidden",
                  border: "2px solid #fff",
                  transition: "border-color 0.2s",
                  backgroundColor: "#95b8d1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.borderColor = "#ddf")
                }
                onMouseOut={(e) => (e.currentTarget.style.borderColor = "#fff")}
              >
                {userProfileImage ? (
                  <img
                    src={userProfileImage}
                    alt="Profile"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.parentNode.innerHTML = userInitial;
                    }}
                  />
                ) : (
                  userInitial
                )}
              </div>

              <Overlay
                show={showPopover}
                target={targetRef.current}
                placement="bottom-end"
                rootClose
                onHide={() => setShowPopover(false)}
              >
                <Popover id="popover-basic" style={{ minWidth: "250px" }}>
                  <Popover.Header
                    as="h3"
                    style={{
                      backgroundColor: "#f0f4f8",
                      borderBottom: "1px solid #e3e8ef",
                    }}
                  >
                    User Profile
                  </Popover.Header>
                  <Popover.Body>
                    <div className="mb-3">
                      <strong>Email:</strong> {userData?.email || "User"}
                    </div>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="w-100 mb-2"
                      onClick={handleEditProfile}
                    >
                      Edit Profile
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="w-100"
                      onClick={handleLogout}
                    >
                      Logout
                    </Button>
                  </Popover.Body>
                </Popover>
              </Overlay>
            </div>
          ) : (
            <Button variant="outline-light" onClick={handleLoginClick}>
              <BoxArrowInRight className="me-1" /> Login
            </Button>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
