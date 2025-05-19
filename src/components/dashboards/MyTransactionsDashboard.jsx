import { Badge, Button, Card, Container, Table } from "react-bootstrap";
import Header from "../Header";
import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const MyTransactionsDashboard = ({ userData, onLogout }) => {
  const [transactions, setTransactions] = useState([]);
  const [transactionLoading, setTransactionLoading] = useState(true);
  const [transactionError, setTransactionError] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchUserTransactions = async (email) => {
    try {
      setTransactionLoading(true);
      const response = await axios.get(
        `/api/transactions/display/${email}?limit=0`
      );
      console.log("Transactions received:", response.data);

      setTransactions(response.data);
      setTransactionError(null);
    } catch (err) {
      console.error("Error fetching transactions:", err.response || err);

      if (err.response?.status === 404) {
        setTransactions([]);
        setTransactionError(null);
      } else {
        setTransactionError("Failed to load transaction history.");
      }
    } finally {
      setTransactionLoading(false);
    }
  };

  const formatRupiah = (price) => {
    if (price === undefined || price === null) return "Rp 0.";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  useEffect(() => {
    fetchUserTransactions(userData.email);
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredTransactions = transactions.filter((t) => {
    const transactionDate = new Date(t.date).toISOString().slice(0, 10); // hasil: "2025-04-30"

    const start = startDate ? startDate : null; // juga dalam format "YYYY-MM-DD"
    const end = endDate ? endDate : null;

    if (start && transactionDate < start) return false;
    if (end && transactionDate > end) return false;
    return true;
  });

  return (
    <>
      <Header userData={userData} onLogout={onLogout} />
      <Container fluid className="p-0">
        <Container className="py-4">
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Body>
              <h5>Welcome, {userData?.name || "User"}</h5>
              <p className="text-muted">
                Browse our products and view your transaction history below.
              </p>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white">
              <h5 className="m-0">My Full Transaction History</h5>
            </Card.Header>
            <Card.Body>
              <h6 className="mb-3">Filter by Date</h6>
              <div className="d-flex flex-wrap gap-2 align-items-center mb-4">
                <div>
                  <label htmlFor="startDate" className="form-label mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    className="form-control"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="form-label mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    className="form-control"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="align-self-end">
                  <Button
                    variant="outline-secondary"
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                    }}
                  >
                    Clear Filter
                  </Button>
                </div>
              </div>

              {transactionLoading ? (
                <div className="text-center py-3">
                  <h6>Loading transaction history...</h6>
                </div>
              ) : transactionError ? (
                <div className="text-center py-3">
                  <h6 className="text-danger">{transactionError}</h6>
                  <Button
                    variant="outline-primary"
                    onClick={() => fetchUserTransactions(userData.email)}
                    className="mt-2"
                    size="sm"
                  >
                    Try Again
                  </Button>
                </div>
              ) : transactions.length > 0 ? (
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Transaction ID</th>
                        <th>Location</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((transaction) => (
                        <tr key={transaction._id}>
                          <td>{formatDate(transaction.date)}</td>
                          <td className="text-muted small">
                            {transaction.transactionId}
                          </td>
                          <td>{transaction.location || "N/A"}</td>
                          <td>{transaction.products?.length || 0} items</td>
                          <td>{formatRupiah(transaction.totalPrice)}</td>
                          <td>
                            <Badge
                              bg={
                                transaction.status === "done"
                                  ? "success"
                                  : transaction.status === "pending"
                                  ? "warning"
                                  : "info"
                              }
                            >
                              {transaction.status === "done"
                                ? "Completed"
                                : transaction.status || "Processing"}
                            </Badge>
                          </td>
                          <td>
                            <Link
                              to={`/transactions/${transaction.transactionId}`}
                            >
                              <Button variant="outline-info" size="sm">
                                View Details
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p>You don't have any transactions yet.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Container>
      </Container>
    </>
  );
};

export default MyTransactionsDashboard;
