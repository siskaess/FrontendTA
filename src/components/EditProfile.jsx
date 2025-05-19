// src/components/EditProfile.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Form,
  Button,
  Alert,
  Row,
  Col,
  Spinner, // Import Spinner for loading indication
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "./Header";

const EditProfile = ({ userData, onLogout }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    profileImage: "",
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
    address: "",
    kode_pos: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true); // Start loading initially
  const [submitting, setSubmitting] = useState(false); // State for submission loading

  const [fotoSayahu, setFotoSayahu] = useState(null);

  // Refined useEffect to load user data
  useEffect(() => {
    const initializeProfile = async () => {
      setLoading(true); // Ensure loading state is true at the start
      setError(""); // Clear previous errors

      try {
        let currentUserData = userData; // Prioritize passed prop

        // If prop is missing, attempt to fetch from API
        if (!currentUserData) {
          const token = localStorage.getItem("token");
          if (!token) {
            navigate("/login"); // Redirect if no token
            return; // Stop execution
          }
          // Fetch profile data
          const response = await axios.get("/api/users/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });

          currentUserData = response.data;
          setFotoSayahu(currentUserData.profileImage); // Set initial image state
          console.log("Fetched user data:", currentUserData);
        } else {
          setFotoSayahu(currentUserData.profileImage); // Set initial image state
          console.log("Using userData prop:", currentUserData);
        }

        // Populate state if data is available
        if (currentUserData) {
          setFormData({
            email: currentUserData.email || "",
            name: currentUserData.name || "",
            password: "", // Always clear password fields on load
            confirmPassword: "",
            address: currentUserData.address || "",
            kode_pos: currentUserData.kode_pos || "",
            profileImage: currentUserData.profileImage || "",
          });
        } else {
          // Handle case where data is still missing after fetch attempt
          setError("Could not load user profile data.");
          console.error(
            "User data is null or undefined after fetch/prop check."
          );
        }
      } catch (err) {
        console.error("Error initializing profile:", err);
        setError(
          err.response?.data?.message ||
            "Failed to load user data. Please try again."
        );
        // Optional: Redirect on critical failure?
        // if (err.response?.status === 401) navigate('/login');
      } finally {
        setLoading(false); // Stop loading indicator
      }
    };

    initializeProfile();
  }, [userData, navigate]); // Dependencies: run if userData prop changes or navigate function changes

  const handleImageChange = (e) => {
    const { name, value, files } = e.target;

    setFormData((prev) => ({
      ...prev,
      profileImage: files[0], // Simpan file object, bukan string
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Basic password match validation
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setSubmitting(true); // Indicate submission is in progress

    try {
      // Prepare data, only include fields intended for update
      const updateData = new FormData();
      updateData.append("name", formData.name);
      updateData.append("address", formData.address);
      updateData.append("kode_pos", formData.kode_pos);
      updateData.append("profileImage", formData.profileImage);

      // Only include password if a new one was entered
      if (formData.password) {
        updateData.append("password", formData.password);
      }

      const token = localStorage.getItem("token");
      // Make PUT request to update profile
      const response = await axios.put("/api/users/profile", updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data", // HARUS multipart kalau upload file
        },
      });

      setSuccess("Profile updated successfully!");
      setFotoSayahu(response.data.profileImage); // Update local image state
      setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" })); // Clear password fields after success

      // Optionally update local storage if you store user data there
      // Note: Be careful about storing sensitive data in local storage
      try {
        const storedUserData =
          JSON.parse(localStorage.getItem("userData")) || {};
        const updatedLocalData = {
          ...storedUserData,
          name: response.data.name,
          alamat: response.data.alamat,
          kode_pos: response.data.kode_pos,
          profileImage: response.data.profileImage, // Update with new image URL
          // Avoid storing password in local storage
        };
        localStorage.setItem("userData", JSON.stringify(updatedLocalData));
      } catch (localError) {
        console.error("Failed to update local storage:", localError);
      }

      // Optionally, trigger a refresh of userData in App.jsx if needed
      // onUpdateSuccess(response.data); // If you pass down a handler function
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(
        err.response?.data?.message || // Use backend error message if available
          "Failed to update profile. Please try again."
      );
    } finally {
      setSubmitting(false); // Indicate submission finished
    }
  };

  // Display loading spinner while fetching initial data
  if (loading) {
    return (
      <>
        <Header userData={userData} onLogout={onLogout} />
        <Container
          className="mt-5 text-center d-flex justify-content-center align-items-center"
          style={{ minHeight: "50vh" }}
        >
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading profile...</span>
          </Spinner>
        </Container>
      </>
    );
  }

  // Main component render
  return (
    <>
      <Header userData={userData} onLogout={onLogout} />
      <Container className="py-4">
        <Row className="justify-content-center">
          <Col lg={8} md={10} sm={12}>
            <Card className="border-0 shadow-sm">
              <Card.Header
                className="bg-white py-3"
                style={{ borderBottom: "1px solid #e3e8ef" }}
              >
                <h4 className="m-0" style={{ color: "#5b6e88" }}>
                  Edit Profile
                </h4>
              </Card.Header>
              <Card.Body className="p-4">
                {/* Display error or success messages */}
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}
                {/* image profile now  */}
                {/* Form uses state values */}
                <Form onSubmit={handleSubmit}>
                  {/* Profile Picture Upload */}
                  <div className="d-flex flex-column align-items-start mb-4">
                    <img
                      src={fotoSayahu || "/default-avatar.png"} // Gambar default jika tidak ada foto
                      alt=""
                      className="rounded-circle mb-2"
                      style={{
                        width: "120px",
                        height: "120px",
                        objectFit: "cover",
                        border: "2px solid #ddd",
                      }}
                    />

                    <Form.Group controlId="formFile" className="mt-2">
                      <Form.Label className="d-block">
                        Change Profile Picture
                      </Form.Label>
                      <Form.Control
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e)}
                      />
                    </Form.Group>
                  </div>

                  {/* Email (disabled) */}
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email} // Populated from state
                      disabled
                      style={{ backgroundColor: "#f8f9fa" }}
                    />
                    <Form.Text className="text-muted">
                      Email cannot be changed
                    </Form.Text>
                  </Form.Group>

                  {/* name */}
                  <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name} // Populated from state
                      onChange={handleChange}
                      placeholder="Enter your name"
                      required // Make name required if needed
                    />
                  </Form.Group>

                  {/* New Password */}
                  <Form.Group className="mb-3">
                    <Form.Label>New Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={formData.password} // State controlled
                      onChange={handleChange}
                      placeholder="Leave blank to keep current password"
                      autoComplete="new-password" // Help password managers
                    />
                    <Form.Text className="text-muted">
                      Only fill this if you want to change your password
                    </Form.Text>
                  </Form.Group>

                  {/* Confirm New Password */}
                  <Form.Group className="mb-4">
                    <Form.Label>Confirm New Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword} // State controlled
                      onChange={handleChange}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      // Disable if new password field is empty
                      disabled={!formData.password}
                    />
                  </Form.Group>

                  {/* Address */}
                  <Form.Group className="mb-3">
                    <Form.Label>Address</Form.Label>
                    <Form.Control
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Enter your adddress"
                      required //
                    />
                  </Form.Group>

                  {/* kode_pos */}
                  <Form.Group className="mb-3">
                    <Form.Label>Postal Code</Form.Label>
                    <Form.Control
                      type="text"
                      name="kode_pos"
                      inputMode="numeric"
                      value={formData.kode_pos}
                      onChange={handleChange}
                      placeholder="Enter your postal code"
                      required
                    />
                  </Form.Group>

                  {/* Action Buttons */}
                  <div className="d-flex gap-2 mt-4">
                    <Button
                      variant="secondary"
                      onClick={() => navigate(-1)} // Go back to previous page
                      disabled={submitting} // Disable while submitting
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      style={{
                        backgroundColor: "#95b8d1",
                        border: "none",
                      }}
                      disabled={submitting} // Disable while submitting
                    >
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
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default EditProfile;
