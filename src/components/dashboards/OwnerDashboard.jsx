// src/components/dashboards/OwnerDashboard.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Row,
  Col,
  Table,
  Badge,
  Form,
  InputGroup,
  Button,
  Nav,
  Tab,
  Modal,
  Dropdown,
  Alert,
  Spinner,
} from "react-bootstrap";
import {
  FaSearch,
  FaUser,
  FaTools,
  FaClipboardList,
  FaUserTie,
  FaPlus,
  FaEdit,
  FaTrash,
  FaUserCog,
  FaChartLine,
  FaBoxOpen,
  FaDollarSign,
  FaImage,
  FaUserCheck,
} from "react-icons/fa";
import { Line, Bar } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import Header from "../Header";

Chart.register(...registerables);

const OwnerDashboard = ({ userData, onLogout }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productFormData, setProductFormData] = useState({
    name: "",
    type: "",
    condition: "new",
    minPurchase: 1,
    brand: "",
    stock: 0,
    price: 0,
    description: [""],
    image: "",
  });
  const [productEditMode, setProductEditMode] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  // User management state
  const [showUserModal, setShowUserModal] = useState(false);
  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    password: "",
    address: "",
    kode_pos: "",
    role: "cs",
  });
  const [editMode, setEditMode] = useState(false);
  const [email, setEmail] = useState(null);

  // Sales report state
  const [startDate, setStartDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 1))
  );
  const [endDate, setEndDate] = useState(new Date());

  // New state for selected employee in performance tab
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  console.log("Start Date:", startDate);
  console.log("End Date:", endDate);

  useEffect(() => {
    // Fetch all data on component mount
    fetchUsers();
    fetchEmployees();
    fetchCustomers();
    fetchRequests();
    fetchProducts();
    fetchSalesData();
  }, []);

  // When date range changes, refetch sales data
  useEffect(() => {
    console.log("TOLONGGGGGGG");
    fetchSalesData();
  }, [startDate, endDate]);

  console.log("PRODUCTS => ", products);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/users");
      setUsers(response.data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users data");
      // Use sample data when API fails
      setUsers(sampleUsers);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/employees");
      setEmployees(response.data);
    } catch (err) {
      console.error("Error fetching employees:", err);
      setError("Failed to load employees data");
      // Use sample data when API fails
      setEmployees(sampleEmployees);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/customers");
      setCustomers(response.data);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError("Failed to load customers data");
      // Use sample data when API fails
      setCustomers(sampleCustomers);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/requests");
      setRequests(response.data);
    } catch (err) {
      console.error("Error fetching service requests:", err);
      setError("Failed to load service requests data");
      // Use sample data when API fails
      setRequests(sampleRequests);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/products");
      setProducts(response.data);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products data");
      // Use sample data when API fails
      setProducts(sampleProducts);
    } finally {
      setLoading(false);
    }
  };

  // Update the fetchSalesData function to keep individual transactions
  // Update the fetchSalesData function to properly use the date range
  const fetchSalesData = async () => {
    try {
      setLoading(true);
      // Format dates for the API call+
      const formattedStartDate = startDate.toISOString().split("T")[0]; // YYYY-MM-DD
      const formattedEndDate = endDate.toISOString().split("T")[0]; // YYYY-MM-DD

      console.log(
        `Fetching sales data from ${formattedStartDate} to ${formattedEndDate}`
      );

      // Use the endpoint for transactions with date parameters
      const response = await axios.get(
        `/api/transactions/date/${formattedStartDate}/${formattedEndDate}`
      );

      // Process transactions to keep individual entries
      const transactions = response.data.map((transaction) => ({
        id: transaction._id || transaction.transactionId,
        date: transaction.date,
        customer: transaction.user || "Unknown",
        revenue: transaction.totalPrice || 0,
        products: transaction.products || [],
        status: transaction.paymentStatus || "unknown",
      }));

      // Sort by date (newest first)
      const sortedTransactions = transactions.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      setSales(sortedTransactions);
    } catch (err) {
      console.error("Error fetching sales data:", err);
      setError("Failed to load sales data");

      // Use sample data when API fails, but filter it by the selected date range
      const filteredSampleSales = sampleSales.filter((sale) => {
        const saleDate = new Date(sale.date);
        return saleDate >= startDate && saleDate <= endDate;
      });

      setSales(filteredSampleSales);
    } finally {
      setLoading(false);
    }
  };

  // Update the prepareSalesData function to ensure it only uses data within the date range
  const prepareSalesData = () => {
    console.log("Preparing sales data for chart");
    // Only include sales within the selected date range
    const filteredSales = displayedSales.filter((sale) => {
      const saleDate = new Date(sale.date);
      return saleDate >= startDate && saleDate <= endDate;
    });

    console.log("Filtered sales data:", filteredSales);

    // Group sales by date for the chart
    const salesByDate = {};

    filteredSales.forEach((sale) => {
      const dateAsli = sale.date;
      const date = dateAsli.slice(0, 10); // hilangkan timezone dan timestamp
      if (!salesByDate[date]) {
        salesByDate[date] = 0;
      }
      salesByDate[date] += sale.revenue;
    });

    // Convert to arrays for chart
    const dates = Object.keys(salesByDate).sort(
      (a, b) => new Date(a) - new Date(b)
    );

    const revenues = dates.map((date) => salesByDate[date]);

    console.log("Sales data for chart:", {
      dates,
      revenues,
    });

    return {
      labels: dates.map((date) => new Date(date).toLocaleDateString("id-ID")),
      datasets: [
        {
          label: "Revenue (Rp)",
          data: revenues,
          fill: true,
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgba(54, 162, 235, 1)",
          tension: 0.1,
        },
      ],
    };
  };

  // User Management Functions
  const handleAddUser = () => {
    setEditMode(false);
    setUserFormData({
      name: "",
      email: "",
      password: "",
      address: "",
      kode_pos: "",
      role: "cs",
    });
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    setEditMode(true);
    setEmail(user.email);
    setUserFormData({
      name: user.name || "",
      email: user.email || "", // Include email to display in disabled field
      password: "", // Password field should be empty when editing
      address: user.address || "",
      kode_pos: user.kode_pos || "",
      role: user.role || "",
    });
    setShowUserModal(true);
  };

  const handleDeleteUser = async (userEmail) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axios.delete(`/api/admin/users/${userEmail}`);
        // Update the users list
        setUsers(users.filter((user) => user.email !== userEmail));
      } catch (err) {
        console.error("Error deleting user:", err);
        setError("Failed to delete user");
      }
    }
  };

  const handleUserFormChange = (e) => {
    const { name, value } = e.target;
    setUserFormData({
      ...userFormData,
      [name]: value,
    });
  };

  const handleUserFormSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    // Basic validation for required fields
    const requiredFields = ["name", "address", "kode_pos", "role"];
    if (!editMode) {
      requiredFields.push("email", "password"); // Email and password required for new user
    }

    for (const field of requiredFields) {
      if (!userFormData[field]) {
        setError(`Field "${field}" must be filled.`);
        return;
      }
    }

    // Validate email format if adding new user
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editMode && !emailRegex.test(userFormData.email)) {
      setError("Invalid email format.");
      return;
    }

    // Validate password length if adding or changing password
    // if (
    //   (!editMode || userFormData.password) &&
    //   userFormData.password.length < 6
    // ) {
    //   setError("Password must be at least 6 characters long.");
    //   return;
    // }

    // Validate role
    if (!["pl", "pk", "cs", "ow"].includes(userFormData.role)) {
      setError("Invalid role selected.");
      return;
    }

    try {
      if (editMode) {
        // Prepare update data - only include fields that are being updated
        const updateData = {
          name: userFormData.name,
          address: userFormData.address,
          kode_pos: userFormData.kode_pos,
          role: userFormData.role,
        };

        // Only include password if a new one was provided
        if (userFormData.password) {
          updateData.password = userFormData.password;
        }

        console.log("Updating user with email:", email); // Use the stored email for the API call
        console.log("Update data:", updateData);

        // Update existing user using the correct admin endpoint
        await axios.put(`/api/admin/users/${email}`, updateData); // Use stored email

        // Update the users list locally (or refetch)
        setUsers(
          users.map(
            (user) => (user.email === email ? { ...user, ...updateData } : user) // Update local state
          )
        );
        console.log("User updated successfully in local state.");
      } else {
        // Create new user using the general user creation endpoint
        const createData = {
          email: userFormData.email,
          name: userFormData.name,
          password: userFormData.password,
          address: userFormData.address,
          kode_pos: userFormData.kode_pos,
          role: userFormData.role,
        };
        console.log("Creating new user with data:", createData);

        const response = await axios.post("/api/users", createData); // Use the correct endpoint

        // Add the new user to the list (or refetch)
        setUsers([...users, response.data]); // Add new user to local state
        console.log(
          "New user created and added to local state:",
          response.data
        );
      }

      // Reset form and close modal
      setShowUserModal(false);
      // Optionally refetch all users to ensure consistency
      // fetchUsers();
    } catch (err) {
      console.error("Error saving user:", err.response || err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to save user. Please check console for details."
      );
    }
  };

  const handleAddProduct = () => {
    setProductEditMode(false);
    setProductFormData({
      name: "",
      type: "",
      condition: "new",
      minPurchase: 1,
      brand: "",
      stock: 0,
      price: 0,
      description: [""],
      image: "",
    });
    setShowProductModal(true);
  };

  const handleEditProduct = (product) => {
    setProductEditMode(true);
    // Check for different possible ID fields and use the first one available
    const productId = product._id || product.id;
    setSelectedProductId(productId);
    console.log("Selected product for edit with ID:", productId);

    setProductFormData({
      name: product.name,
      type: product.type || "",
      condition: product.condition || "new",
      minPurchase: product.minPurchase || 1,
      brand: product.brand || "",
      stock: product.stock || 0,
      price: product.price || 0,
      description: product.description || [""],
      image: product.image || "",
    });
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (!productId) {
      setError("Cannot delete product: Missing product ID");
      return;
    }

    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        console.log("Deleting product with ID:", productId);
        await axios.delete(`/api/products/${productId}`);
        // Update the products list
        setProducts(
          products.filter((product) => {
            const id = product._id || product.id;
            return id !== productId;
          })
        );
      } catch (err) {
        console.error("Error deleting product:", err);
        setError("Failed to delete product");
      }
    }
  };

  const handleProductFormChange = (e) => {
    const { name, value } = e.target;
    setProductFormData({
      ...productFormData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleDescriptionChange = (index, value) => {
    const updatedDescriptions = [...productFormData.description];
    updatedDescriptions[index] = value;
    setProductFormData({
      ...productFormData,
      description: updatedDescriptions,
    });
  };

  const addDescriptionField = () => {
    setProductFormData({
      ...productFormData,
      description: [...productFormData.description, ""],
    });
  };

  const removeDescriptionField = (index) => {
    const updatedDescriptions = [...productFormData.description];
    updatedDescriptions.splice(index, 1);
    setProductFormData({
      ...productFormData,
      description: updatedDescriptions,
    });
  };

  const handleProductFormSubmit = async (e) => {
    e.preventDefault();
    try {
      // Create a FormData object to handle file uploads
      const formData = new FormData();

      // Add all form fields to FormData
      formData.append("name", productFormData.name);
      formData.append("type", productFormData.type);
      formData.append("brand", productFormData.brand);
      formData.append("condition", productFormData.condition);
      formData.append("minPurchase", productFormData.minPurchase);
      formData.append("price", productFormData.price);
      formData.append("stock", productFormData.stock);

      // Convert description array to a JSON string
      formData.append(
        "description",
        JSON.stringify(productFormData.description)
      );

      // Add the image file - this is crucial
      if (imageFile) {
        formData.append("image", imageFile); // Make sure field name matches backend expectation
      } else if (!productEditMode) {
        // Show error if no image is selected for a new product
        setError("Product image is required");
        return;
      }

      // Log what we're sending for debugging
      console.log("FormData fields:");
      for (let [key, value] of formData.entries()) {
        console.log(
          `${key}: ${value instanceof File ? `File: ${value.name}` : value}`
        );
      }

      if (productEditMode) {
        console.log("Updating product with ID:", selectedProductId);
        if (!selectedProductId) {
          throw new Error("Missing product ID for update operation");
        }

        await axios.put(`/api/products/${selectedProductId}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        // Update products list after successful update
        fetchProducts(); // Refresh from API instead of local update
      } else {
        console.log("Creating new product");
        const response = await axios.post("/api/products", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        // Add new product to list
        setProducts([...products, response.data]);
      }

      // Reset form state and close modal on success
      setShowProductModal(false);
      setImageFile(null);
      setError(null);
    } catch (err) {
      console.error("Error saving product:", err);
      console.error("Error details:", err.response?.data, err.response?.status);
      setError(
        err.response?.data?.message || err.message || "Failed to save product"
      );
    }
  };

  // Sample data to show before backend integration
  const sampleUsers = [
    {
      email: "john@example.com",
      name: "John Smith",
      address: "123 Main St",
      kode_pos: "12345",
      role: "pk",
    },
    {
      email: "jane@example.com",
      name: "Jane Doe",
      address: "456 Elm St",
      kode_pos: "67890",
      role: "tk",
    },
    {
      email: "alice@example.com",
      name: "Alice Johnson",
      address: "789 Oak St",
      kode_pos: "54321",
      role: "cs",
    },
  ];

  const sampleEmployees = [
    {
      id: 1,
      name: "John Smith",
      email: "john@example.com",
      role: "pk",
      activeRequests: 5,
      performance: [
        { month: "Jan", rating: 4.2 },
        { month: "Feb", rating: 4.5 },
        { month: "Mar", rating: 4.3 },
        { month: "Apr", rating: 4.7 },
        { month: "May", rating: 4.8 },
      ],
    },
    {
      id: 2,
      name: "Jane Doe",
      email: "jane@example.com",
      role: "tk",
      activeRequests: 3,
      performance: [
        { month: "Jan", rating: 4.0 },
        { month: "Feb", rating: 4.2 },
        { month: "Mar", rating: 4.1 },
        { month: "Apr", rating: 4.3 },
        { month: "May", rating: 4.4 },
      ],
    },
    {
      id: 3,
      name: "Mike Johnson",
      email: "mike@example.com",
      role: "pk",
      activeRequests: 2,
      performance: [
        { month: "Jan", rating: 3.8 },
        { month: "Feb", rating: 4.0 },
        { month: "Mar", rating: 4.3 },
        { month: "Apr", rating: 4.5 },
        { month: "May", rating: 4.6 },
      ],
    },
  ];

  const sampleCustomers = [
    {
      id: 101,
      name: "Alice Johnson",
      email: "alice@example.com",
      totalRequests: 8,
      lastActive: "2023-05-15",
    },
    {
      id: 102,
      name: "Bob Williams",
      email: "bob@example.com",
      totalRequests: 3,
      lastActive: "2023-05-10",
    },
  ];

  const sampleRequests = [
    {
      id: 1001,
      customer: "Alice Johnson",
      type: "Installation",
      status: "In Progress",
      assigned: "Jane Doe",
      date: "2023-05-12",
    },
    {
      id: 1002,
      customer: "Bob Williams",
      type: "Repair",
      status: "Pending",
      assigned: "Not Assigned",
      date: "2023-05-14",
    },
  ];

  const sampleProducts = [
    {
      id: 1,
      name: "Fiber Optic Cable",
      type: "Networking",
      condition: "new",
      minPurchase: 1,
      brand: "FiberTech",
      stock: 35,
      price: 120.5,
      description: [
        "High-speed fiber optic cable",
        "100m length",
        "Low signal loss",
      ],
      image: "fiber_cable.jpg",
    },
    {
      id: 2,
      name: "Wireless Router AC1200",
      type: "Hardware",
      condition: "new",
      minPurchase: 1,
      brand: "NetGear",
      stock: 15,
      price: 89.99,
      description: [
        "Dual-band wireless router",
        "Up to 1200Mbps",
        "4 LAN ports",
      ],
      image: "router.jpg",
    },
    {
      id: 3,
      name: "Network Switch 24-port",
      type: "Hardware",
      condition: "new",
      minPurchase: 1,
      brand: "Cisco",
      stock: 8,
      price: 199.99,
      description: [
        "24-port gigabit switch",
        "Enterprise grade",
        "Rack mountable",
      ],
      image: "switch.jpg",
    },
    {
      id: 4,
      name: "Cat 6 Cable",
      type: "Networking",
      condition: "new",
      minPurchase: 2,
      image: "cat6_cable.jpg",
    },
  ];

  const sampleSales = [
    { date: "2023-05-01", revenue: 2500 },
    { date: "2023-05-02", revenue: 3200 },
    { date: "2023-05-03", revenue: 2800 },
    { date: "2023-05-04", revenue: 3500 },
    { date: "2023-05-05", revenue: 4000 },
    { date: "2023-05-06", revenue: 3700 },
    { date: "2023-05-07", revenue: 2900 },
  ];

  const displayedUsers = users.length > 0 ? users : sampleUsers;
  const displayedEmployees = employees.length > 0 ? employees : sampleEmployees;
  const displayedCustomers = customers.length > 0 ? customers : sampleCustomers;
  const displayedRequests = requests.length > 0 ? requests : sampleRequests;
  const displayedProducts = products.length > 0 ? products : sampleProducts;
  const displayedSales = sales.length > 0 ? sales : sampleSales;

  // Filter data based on search term
  const filteredUsers = displayedUsers.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEmployees = displayedEmployees.filter(
    (employee) =>
      employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = displayedProducts.filter(
    (product) =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role) => {
    switch (role) {
      case "pk":
        return <Badge bg="info">Office Staff</Badge>;
      case "pl":
        return <Badge bg="success">Field Staff</Badge>;
      case "cs":
        return <Badge bg="secondary">Customer</Badge>;
      case "ow":
        return <Badge bg="primary">Owner</Badge>;
      default:
        return <Badge bg="dark">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return <Badge bg="success">Completed</Badge>;
      case "in progress":
        return <Badge bg="info">In Progress</Badge>;
      case "pending":
        return <Badge bg="warning">Pending</Badge>;
      case "in stock":
        return <Badge bg="success">In Stock</Badge>;
      case "low stock":
        return <Badge bg="warning">Low Stock</Badge>;
      case "out of stock":
        return <Badge bg="danger">Out of Stock</Badge>;
      default:
        return <Badge bg="secondary">Unknown</Badge>;
    }
  };

  // Prepare chart data for employee performance
  const prepareEmployeePerformanceData = (employee) => {
    if (!employee.performance) return null;

    return {
      labels: employee.performance.map((p) => p.month),
      datasets: [
        {
          label: "Performance Rating",
          data: employee.performance.map((p) => p.rating),
          fill: false,
          backgroundColor: "rgba(75,192,192,0.4)",
          borderColor: "rgba(75,192,192,1)",
          tension: 0.1,
        },
      ],
    };
  };

  // Update the prepareEmployeeHistogramData function to work with a simple rating array
  const prepareEmployeeHistogramData = (employee) => {
    console.log("Preparing histogram data for employee:", employee);

    // Check if employee has ratings
    if (!employee || !employee.rating || employee.rating.length === 0)
      return null;

    // Use the rating array directly
    const ratings = employee.rating;

    // Create bins for the histogram (ratings from 1-5, in 0.5 increments)
    const bins = ["1", "2", "3", "4", "5"];

    // Count ratings in each bin
    const binCounts = Array(bins.length).fill(0);

    ratings.forEach((rating) => {
      // Determine which bin this rating falls into (1-based index)
      if (rating.rating_number >= 1 && rating.rating_number <= 5) {
        binCounts[rating.rating_number - 1]++;
      }
    });

    // Generate colors: higher ratings = more green
    const backgroundColor = binCounts.map((_, index) => {
      const greenIntensity = (index / (bins.length - 1)) * 255;
      return `rgba(54, ${greenIntensity}, 235, 0.6)`;
    });

    return {
      labels: bins,
      datasets: [
        {
          label: "Number of Ratings",
          data: binCounts,
          backgroundColor,
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    };
  };

  // Update the prepareSalesData function to group by date for the chart

  // Reset error when modal is closed
  const handleCloseModal = () => {
    setShowUserModal(false);
    setError(null);
  };

  // Find the selected employee object
  const selectedEmployee = employees.find(
    (emp) => (emp.id || emp.email) === selectedEmployeeId
  );

  return (
    <>
      <Header userData={userData} onLogout={onLogout} />

      <Container fluid>
        {/* Dashboard Header */}
        <Row className="bg-light py-3 mb-4">
          <Col>
            <h3 className="mb-0">Welcome, {userData.name}</h3>
            <p className="text-muted mb-0">
              Manage your company and operations
            </p>
          </Col>
        </Row>

        {/* Search and Tab Navigation */}
        <Row className="mb-4">
          <Col md={6} lg={4} className="mb-3">
            <InputGroup>
              <InputGroup.Text>
                <FaSearch />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </Col>
          <Col md={6} lg={8}>
            <Nav variant="tabs">
              <Nav.Item>
                <Nav.Link
                  active={activeTab === "users"}
                  onClick={() => setActiveTab("users")}
                >
                  <FaUserCog className="me-1" />
                  User Management
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === "employees"}
                  onClick={() => setActiveTab("employees")}
                >
                  <FaChartLine className="me-1" />
                  Employee Performance
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === "sales"}
                  onClick={() => setActiveTab("sales")}
                >
                  <FaDollarSign className="me-1" />
                  Sales Report
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === "products"}
                  onClick={() => setActiveTab("products")}
                >
                  <FaBoxOpen className="me-1" />
                  Product Management
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>
        </Row>

        {/* Tab Content */}
        <Row>
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                {loading && activeTab !== "employees" && (
                  <div className="text-center">
                    <Spinner animation="border" variant="primary" /> Loading
                    data...
                  </div>
                )}
                {error && (
                  <Alert variant="danger" className="text-center">
                    {error}
                  </Alert>
                )}

                {!loading && !error && (
                  <Tab.Content>
                    {/* User Management Tab */}
                    <Tab.Pane active={activeTab === "users"}>
                      <div className="d-flex justify-content-between mb-3">
                        <h4>User Management</h4>
                        <Button variant="primary" onClick={handleAddUser}>
                          <FaPlus className="me-1" /> Add New User
                        </Button>
                      </div>
                      <Table hover responsive>
                        {/* Updated Table Headers */}
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Address</th>
                            <th>Kode Pos</th>
                            <th>Role</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                              // Use email as key since it's unique
                              <tr key={user.email}>
                                <td>{user.name || "N/A"}</td>
                                <td>{user.email || "N/A"}</td>
                                <td>{user.address || "N/A"}</td>
                                {/* Display Address */}
                                <td>{user.kode_pos || "N/A"}</td>
                                {/* Display Kode Pos */}
                                <td>{getRoleBadge(user.role)}</td>
                                <td>
                                  <div className="d-flex gap-2">
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() => handleEditUser(user)}
                                      title="Edit User"
                                    >
                                      <FaEdit />
                                    </Button>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() =>
                                        handleDeleteUser(user.email)
                                      }
                                      title="Delete User"
                                    >
                                      <FaTrash />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              {/* Update colspan */}
                              <td colSpan="6" className="text-center">
                                No users found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </Tab.Pane>

                    {/* Employee Performance Tab */}
                    <Tab.Pane active={activeTab === "employees"}>
                      <div className="mb-4">
                        <h4>Employee Performance</h4>
                        <p className="text-muted">
                          Select an employee to view their performance ratings.
                        </p>
                      </div>

                      {/* Employee Selection Dropdown */}
                      <Row className="mb-4">
                        <Col md={6}>
                          <Form.Group controlId="employeeSelect">
                            <Form.Label>
                              Select Employee (Field Staff)
                            </Form.Label>
                            <Form.Select
                              value={selectedEmployeeId}
                              onChange={(e) =>
                                setSelectedEmployeeId(e.target.value)
                              }
                            >
                              <option value="">-- Select an Employee --</option>
                              {employees
                                .filter((emp) => emp.role === "pl")
                                .map((employee) => (
                                  <option
                                    key={employee.id || employee.email}
                                    value={employee.id || employee.email}
                                  >
                                    {employee.name} ({employee.email})
                                  </option>
                                ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>

                      {/* Display chart and metrics for the selected employee */}
                      {selectedEmployeeId && selectedEmployee ? (
                        <Card className="mb-4 border-0 shadow-sm">
                          <Card.Body>
                            <h5>{selectedEmployee.name}</h5>
                            <p className="text-muted">
                              {selectedEmployee.email}
                            </p>
                            <div style={{ height: "300px" }}>
                              {selectedEmployee.rating &&
                              selectedEmployee.rating.length > 0 ? (
                                <Bar
                                  data={prepareEmployeeHistogramData(
                                    selectedEmployee
                                  )}
                                  options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    scales: {
                                      y: {
                                        beginAtZero: true,
                                        title: {
                                          display: true,
                                          text: "Number of Ratings",
                                        },
                                        ticks: {
                                          stepSize: 1,
                                          precision: 0,
                                        },
                                      },
                                      x: {
                                        title: {
                                          display: true,
                                          text: "Rating Value",
                                        },
                                      },
                                    },
                                    plugins: {
                                      legend: {
                                        display: false,
                                      },
                                      tooltip: {
                                        callbacks: {
                                          title: function (tooltipItems) {
                                            const rating =
                                              tooltipItems[0].label;
                                            return `Rating: ${rating}/5`;
                                          },
                                          label: function (context) {
                                            return `${context.raw} occurrences`;
                                          },
                                        },
                                      },
                                    },
                                  }}
                                />
                              ) : (
                                <div className="d-flex align-items-center justify-content-center h-100">
                                  <p className="text-muted">
                                    No ratings available for this employee.
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Display key metrics for selected employee */}
                            <Row className="mt-4">
                              <Col md={4}>
                                <div className="border rounded p-3 text-center">
                                  <h6>Average Rating</h6>
                                  <h3>
                                    {selectedEmployee.rating &&
                                    selectedEmployee.rating.length > 0
                                      ? (
                                          selectedEmployee.rating.reduce(
                                            (sum, rating) =>
                                              sum + rating.rating_number,
                                            0
                                          ) / selectedEmployee.rating.length
                                        ).toFixed(2)
                                      : "N/A"}
                                  </h3>
                                </div>
                              </Col>
                              <Col md={4}>
                                <div className="border rounded p-3 text-center">
                                  <h6>Latest Rating</h6>
                                  <h3>
                                    {selectedEmployee.rating &&
                                    selectedEmployee.rating.length > 0
                                      ? selectedEmployee.rating[
                                          selectedEmployee.rating.length - 1
                                        ].rating_number
                                      : "N/A"}
                                  </h3>
                                </div>
                              </Col>
                              <Col md={4}>
                                <div className="border rounded p-3 text-center">
                                  <h6>Total Reviews</h6>
                                  <h3>
                                    {selectedEmployee.rating
                                      ? selectedEmployee.rating.length
                                      : 0}
                                  </h3>
                                </div>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      ) : selectedEmployeeId ? (
                        <Alert variant="warning">
                          Selected employee data not found.
                        </Alert>
                      ) : (
                        <Alert variant="info">
                          Please select an employee to view their performance.
                        </Alert>
                      )}

                      {/* Message if no field workers are available at all */}
                      {employees.filter((e) => e.role === "pl").length ===
                        0 && (
                        <Alert variant="info">
                          No field workers found. Add field workers with
                          performance data to view charts.
                        </Alert>
                      )}
                    </Tab.Pane>

                    {/* Sales Report Tab */}
                    <Tab.Pane active={activeTab === "sales"}>
                      <div className="d-flex justify-content-between mb-4 align-items-center">
                        <h4>Sales Report</h4>
                        <div className="d-flex gap-2 align-items-center">
                          <label>Date Range:</label>
                          <DatePicker
                            selected={startDate}
                            onChange={(date) => setStartDate(new Date(date))}
                            className="form-control"
                            dateFormat="yyyy-MM-dd"
                          />
                          <span>to</span>
                          <DatePicker
                            selected={endDate}
                            onChange={(date) => setEndDate(new Date(date))}
                            className="form-control"
                            dateFormat="yyyy-MM-dd"
                            minDate={startDate}
                          />
                        </div>
                      </div>

                      <Card className="mb-4 border-0 shadow-sm">
                        <Card.Body>
                          <div style={{ height: "400px" }}>
                            <Line
                              data={prepareSalesData()}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                  y: {
                                    beginAtZero: true,
                                    title: {
                                      display: true,
                                      text: "Revenue (Rp)",
                                    },
                                    ticks: {
                                      // Format currency values
                                      callback: function (value) {
                                        return (
                                          "Rp" + value.toLocaleString("id-ID")
                                        );
                                      },
                                    },
                                  },
                                  x: {
                                    title: {
                                      display: true,
                                      text: "Date",
                                    },
                                  },
                                },
                                plugins: {
                                  tooltip: {
                                    callbacks: {
                                      label: function (context) {
                                        let label = context.dataset.label || "";
                                        if (label) {
                                          label += ": ";
                                        }
                                        if (context.parsed.y !== null) {
                                          label +=
                                            "Rp" +
                                            context.parsed.y.toLocaleString(
                                              "id-ID"
                                            );
                                        }
                                        return label;
                                      },
                                    },
                                  },
                                  legend: {
                                    display: true,
                                    position: "top",
                                  },
                                },
                              }}
                            />
                          </div>
                        </Card.Body>
                      </Card>

                      <Card className="border-0 shadow-sm">
                        <Card.Body>
                          <h5>Sales Data</h5>
                          <Table responsive hover>
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Products</th>
                                <th>Revenue</th>
                              </tr>
                            </thead>
                            <tbody>
                              {displayedSales.map((sale, index) => (
                                <tr key={sale.id || index}>
                                  <td>
                                    {new Date(sale.date).toLocaleDateString(
                                      "id-ID"
                                    )}
                                  </td>
                                  <td>{sale.customer}</td>
                                  <td>
                                    {Array.isArray(sale.products)
                                      ? sale.products.length > 0
                                        ? sale.products.slice(0, 2).join(", ") +
                                          (sale.products.length > 2
                                            ? "..."
                                            : "")
                                        : "-"
                                      : "-"}
                                  </td>
                                  <td>
                                    Rp {sale.revenue.toLocaleString("id-ID")}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </Card.Body>
                      </Card>
                    </Tab.Pane>

                    {/* Product Management Tab */}
                    <Tab.Pane active={activeTab === "products"}>
                      <div className="d-flex justify-content-between mb-3">
                        <h4>Product Management</h4>
                        <Button variant="primary" onClick={handleAddProduct}>
                          <FaPlus className="me-1" /> Add New Product
                        </Button>
                      </div>
                      <Table hover responsive>
                        <thead>
                          <tr>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Brand</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => {
                              // Get the appropriate ID
                              const productId = product._id || product.id;

                              return (
                                <tr key={productId}>
                                  <td>
                                    {product.image ? (
                                      <img
                                        src={
                                          product.image.startsWith("http")
                                            ? product.image
                                            : `/images/${product.image}`
                                        }
                                        alt={product.name}
                                        style={{
                                          width: "50px",
                                          height: "50px",
                                          objectFit: "cover",
                                        }}
                                        className="rounded"
                                      />
                                    ) : (
                                      <div
                                        className="bg-light rounded"
                                        style={{
                                          width: "50px",
                                          height: "50px",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                      >
                                        <FaImage color="#adb5bd" />
                                      </div>
                                    )}
                                  </td>
                                  <td>{product.name}</td>
                                  <td>{product.type}</td>
                                  <td>{product.brand}</td>
                                  <td>
                                    Rp.{" "}
                                    {(product.price || 0).toLocaleString(
                                      "id-ID"
                                    )}
                                  </td>
                                  <td>{product.stock}</td>
                                  <td>
                                    <div className="d-flex gap-2">
                                      <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() =>
                                          handleEditProduct(product)
                                        }
                                      >
                                        <FaEdit />
                                      </Button>
                                      <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() =>
                                          handleDeleteProduct(productId)
                                        }
                                      >
                                        <FaTrash />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan="7" className="text-center">
                                No products found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </Tab.Pane>
                  </Tab.Content>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* User Modal */}
      <Modal show={showUserModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editMode ? "Edit User" : "Tambah User Baru"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUserFormSubmit}>
          <Modal.Body>
            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
              </Alert>
            )}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={userFormData.name}
                    onChange={handleUserFormChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={userFormData.email}
                    onChange={handleUserFormChange}
                    required
                    disabled={editMode} // Disable email field when in edit mode
                  />
                  {editMode && (
                    <Form.Text className="text-muted">
                      Email cannot be changed as it is used as a unique
                      identifier.
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {editMode ? "New Password" : "Password"}
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={userFormData.password}
                    onChange={handleUserFormChange}
                    required={!editMode}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    type="text"
                    name="address"
                    value={userFormData.address}
                    onChange={handleUserFormChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Kode Pos</Form.Label>
                  <Form.Control
                    type="text"
                    name="kode_pos"
                    value={userFormData.kode_pos}
                    onChange={handleUserFormChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Select
                    name="role"
                    value={userFormData.role}
                    onChange={handleUserFormChange}
                    required
                  >
                    <option value="cs">Customer</option>
                    <option value="pk">Office Staff</option>
                    <option value="pl">Field Staff</option>
                    <option value="ow">Owner</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowUserModal(false)}>
              Batal
            </Button>
            <Button variant="primary" type="submit">
              {editMode ? "Update User" : "Tambah User"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Product Modal */}
      <Modal show={showProductModal} onHide={() => setShowProductModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {productEditMode ? "Edit Product" : "Add New Product"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleProductFormSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Product Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={productFormData.name}
                    onChange={handleProductFormChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Product Type</Form.Label>
                  <Form.Control
                    type="text"
                    name="type"
                    value={productFormData.type}
                    onChange={handleProductFormChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Product Brand</Form.Label>
                  <Form.Control
                    type="text"
                    name="brand"
                    value={productFormData.brand}
                    onChange={handleProductFormChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Product Condition</Form.Label>
                  <Form.Select
                    name="condition"
                    value={productFormData.condition}
                    onChange={handleProductFormChange}
                    required
                  >
                    <option value="new">New</option>
                    <option value="used">Used</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Min Purchase</Form.Label>
                  <Form.Control
                    type="number"
                    name="minPurchase"
                    value={productFormData.minPurchase}
                    onChange={handleProductFormChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Price</Form.Label>
                  <Form.Control
                    type="number"
                    name="price"
                    value={productFormData.price}
                    onChange={handleProductFormChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Stock</Form.Label>
                  <Form.Control
                    type="number"
                    name="stock"
                    value={productFormData.stock}
                    onChange={handleProductFormChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="description"
                    value={productFormData.description.join("\n")}
                    onChange={(e) => {
                      const descriptions = e.target.value.split("\n");
                      setProductFormData({
                        ...productFormData,
                        description: descriptions,
                      });
                    }}
                    required
                  />
                  <Form.Text className="text-muted">
                    Enter each description point on a new line
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Image</Form.Label>
                  <Form.Control
                    type="file"
                    name="imageFile"
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                  {productEditMode && productFormData.image && (
                    <div className="mt-2">
                      <small>Current image: {productFormData.image}</small>
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowProductModal(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {productEditMode ? "Update Product" : "Add Product"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default OwnerDashboard;
