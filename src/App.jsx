import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import Login from "./components/Login";
import Register from "./components/Register";
import HomePage from "./components/HomePage"; // Import HomePage
import CustomerDashboard from "./components/dashboards/CustomerDashboard";
import OfficeWorkerDashboard from "./components/dashboards/OfficeWorkerDashboard";
import FieldWorkerDashboard from "./components/dashboards/FieldWorkerDashboard";
import OwnerDashboard from "./components/dashboards/OwnerDashboard";
import EditProfile from "./components/EditProfile";
import AddProduct from "./components/products/AddProduct";
import EditProduct from "./components/products/EditProduct";
import PaymentDetail from "./components/payments/PaymentDetail";
import ProductDetail from "./components/products/ProductDetail";
import ScheduleDetail from "./components/schedules/ScheduleDetail";
import AssignWorker from "./components/schedules/AssignWorker";
import CartPage from "./components/cart/CartPage";
import PaymentInstructions from "./components/payments/PaymentInstructions";
import PaymentStatus from "./components/payments/PaymentStatus";
import PaymentSuccess from "./components/payments/PaymentSuccess";
import TransactionDetail from "./components/transactions/TransactionDetail";
import { CartProvider } from "./context/CartContext"; // Assuming CartProvider wraps App
import MyTransactionsDashboard from "./components/dashboards/MyTransactionsDashboard";

// Set base URL for all API requests
axios.defaults.baseURL = "https://backendta-production-034f.up.railway.app/";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      const storedUserData = localStorage.getItem("userData");

      if (!token) {
        if (isMounted) setLoading(false);
        return;
      }

      // Set default auth state from storage
      setAuthFromStorage();
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`; // sudah redundant di setAuthFromStorage, bisa dihapus

      let currentUserData = null;

      if (storedUserData) {
        try {
          currentUserData = JSON.parse(storedUserData);
          if (currentUserData.role && currentUserData.role !== role) {
            console.warn("Role mismatch. Updating localStorage role.");
            if (isMounted) setUserRole(currentUserData.role);
            localStorage.setItem("role", currentUserData.role);
          }
        } catch (e) {
          console.error("Error parsing userData:", e);
          localStorage.removeItem("userData");
        }
      }

      // Jika data tidak lengkap atau role mismatch, ambil ulang dari server
      if (
        !currentUserData ||
        !currentUserData.role ||
        currentUserData.role !== role
      ) {
        try {
          await fetchUserProfile(token, isMounted);
        } catch (error) {
          console.error("Failed to fetch profile:", error);
          if (isMounted) {
            handleLogout();
          }
        }
      }

      if (isMounted) setLoading(false);
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchUserProfile = async (token, isMounted) => {
    try {
      const response = await axios.get("/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userDataFromApi = response.data;
      if (isMounted) {
        setUserData(userDataFromApi);
        if (userDataFromApi.role) {
          setUserRole(userDataFromApi.role);
          localStorage.setItem("role", userDataFromApi.role); // Update local storage role
        } else {
          console.error("Fetched profile does not contain a role!");
          handleLogout();
        }
        localStorage.setItem("userData", JSON.stringify(userDataFromApi));
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      localStorage.clear(); // atau hapus token & data satu per satu
      setIsAuthenticated(false);
      setUserRole(null);
      setUserData(null);
      if (isMounted) {
        handleLogout();
        setLoading(false);
      }
    }
  };

  const setAuthFromStorage = () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const user = localStorage.getItem("userData");

    if (token && user) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setIsAuthenticated(true);
      setUserRole(role);
      setUserData(JSON.parse(user));
    }
  };

  const handleLogin = async (token, role, user) => {
    handleLogout();
    setLoading(true);

    try {
      // Simpan token dan user ke localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("userData", JSON.stringify(user));

      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setIsAuthenticated(true);
      setUserRole(role);
      setUserData(user);
      setLoading(false);
    } catch (error) {
      console.error("Login failed:", error);
      handleLogout();
      setLoading(false);
      throw error;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userData");
    delete axios.defaults.headers.common["Authorization"];
    setIsAuthenticated(false);
    setUserRole(null);
    setUserData(null);
  };

  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (loading) {
      return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    if (!userRole) {
      console.error(
        "ProtectedRoute: Authenticated but userRole is still null/undefined. Redirecting to login."
      );
      handleLogout();
      return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
      const rolePath =
        userRole === "cs"
          ? "customer"
          : userRole === "pk"
          ? "office"
          : userRole === "pl"
          ? "field"
          : userRole === "ow"
          ? "owner"
          : null;

      if (rolePath) {
        return <Navigate to={`/dashboard/${rolePath}`} replace />;
      } else {
        console.error("ProtectedRoute: Invalid user role detected:", userRole);
        handleLogout();
        return <Navigate to="/login" replace />;
      }
    }

    return React.cloneElement(children, { userData, onLogout: handleLogout });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        Loading Application...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              userRole ? (
                (() => {
                  const rolePath =
                    userRole === "cs"
                      ? "customer"
                      : userRole === "pk"
                      ? "office"
                      : userRole === "pl"
                      ? "field"
                      : userRole === "ow"
                      ? "owner"
                      : null;

                  if (rolePath) {
                    return <Navigate to={`/dashboard/${rolePath}`} replace />;
                  } else {
                    console.error(
                      "Root Route: Authenticated user has invalid role:",
                      userRole
                    );
                    handleLogout();
                    return <Navigate to="/login" replace />;
                  }
                })()
              ) : (
                <div>Verifying role...</div>
              )
            ) : (
              <HomePage />
            )
          }
        />

        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Register />}
        />

        <Route
          path="/dashboard/customer"
          element={
            <ProtectedRoute allowedRoles={["cs"]}>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/my-transactions"
          element={
            <ProtectedRoute allowedRoles={["cs"]}>
              <MyTransactionsDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/office"
          element={
            <ProtectedRoute allowedRoles={["pk"]}>
              <OfficeWorkerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/field"
          element={
            <ProtectedRoute allowedRoles={["pl"]}>
              <FieldWorkerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/owner"
          element={
            <ProtectedRoute allowedRoles={["ow"]}>
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/add"
          element={
            <ProtectedRoute allowedRoles={["pk", "ow"]}>
              <AddProduct />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/edit/:id"
          element={
            <ProtectedRoute allowedRoles={["pk", "ow"]}>
              <EditProduct />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments/detail/:id"
          element={
            <ProtectedRoute allowedRoles={["cs", "pk", "ow"]}>
              <PaymentDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/:id"
          element={
            <ProtectedRoute>
              <ProductDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedules/detail/:id"
          element={
            <ProtectedRoute allowedRoles={["pk", "pl", "ow"]}>
              <ScheduleDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedules/edit/:id"
          element={
            <ProtectedRoute allowedRoles={["pk", "ow"]}>
              <AssignWorker />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <ProtectedRoute allowedRoles={["cs"]}>
              <CartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment-instructions/:transactionId"
          element={
            <ProtectedRoute allowedRoles={["cs"]}>
              <PaymentInstructions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment-status/:transactionId"
          element={
            <ProtectedRoute allowedRoles={["cs", "pk", "ow"]}>
              <PaymentStatus />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment-success"
          element={
            <ProtectedRoute allowedRoles={["cs"]}>
              <PaymentSuccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions/:id"
          element={
            <ProtectedRoute allowedRoles={["cs", "pk", "ow"]}>
              <TransactionDetail />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
