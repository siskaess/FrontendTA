import React, { useState, useEffect } from "react";
import { Container, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Header from "../Header";

const AssignFieldWorker = ({ userData, onLogout }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transaction, setTransaction] = useState(null);
  const [fieldWorkers, setFieldWorkers] = useState([]);
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    assignTo: [],
  });

  // Fetch transaction data and field workers
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        // Fetch transaction details
        const transactionRes = await axios.get(`/api/transactions/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTransaction(transactionRes.data);

        // Fetch field workers
        const workersRes = await axios.get("/api/users/fieldworkers", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFieldWorkers(workersRes.data);

        setError(null);
      } catch (err) {
        setError("Gagal memuat data. Silakan coba lagi.");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Create schedule
      const scheduleData = {
        customer: transaction.user,
        date: formData.date,
        time: formData.time,
        transaction: transaction.transactionId,
        assignTo: formData.assignTo,
        status: "pending",
      };

      // Create schedule
      await axios.post("/api/schedules", scheduleData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update transaction status
      await axios.put(
        `/api/transactions/confirm/${id}`, 
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Jadwal berhasil dibuat dan pembayaran dikonfirmasi!");
      navigate("/dashboard/office");
    } catch (err) {
      setError("Gagal membuat jadwal. Silakan coba lagi.");
      console.error("Error creating schedule:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "assignTo") {
      const selectedOptions = Array.from(
        e.target.selectedOptions,
        (option) => option.value
      );
      setFormData((prev) => ({
        ...prev,
        [name]: selectedOptions,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  if (loading) {
    return (
      <>
        <Header userData={userData} onLogout={onLogout} />
        <Container className="py-5 text-center">
          <Spinner animation="border" />
        </Container>
      </>
    );
  }

  return (
    <>
      <Header userData={userData} onLogout={onLogout} />
      <Container className="py-5">
        <Card className="shadow-sm">
          <Card.Header className="bg-white">
            <h5 className="mb-0">Assign Field Worker</h5>
          </Card.Header>
          <Card.Body>
            {error && <Alert variant="danger">{error}</Alert>}

            {transaction && (
              <div className="mb-4">
                <h6>Detail Transaksi:</h6>
                <p>ID Transaksi: {transaction.transactionId}</p>
                <p>Pelanggan: {transaction.user}</p>
                <p>Lokasi: {transaction.location}</p>
                <p>Total: Rp. {transaction.totalPrice?.toLocaleString()}</p>
              </div>
            )}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Tanggal Instalasi</Form.Label>
                <Form.Control
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Waktu Instalasi</Form.Label>
                <Form.Control
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Pilih Field Worker</Form.Label>
                <Form.Select
                  multiple
                  name="assignTo"
                  value={formData.assignTo}
                  onChange={handleChange}
                  required
                >
                  {fieldWorkers && fieldWorkers.length > 0 ? (
                    fieldWorkers.map((worker) => (
                      <option key={worker.email} value={worker.email}>
                        {worker.name || worker.email}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      Tidak ada field worker yang tersedia
                    </option>
                  )}
                </Form.Select>
                <Form.Text className="text-muted">
                  Tahan Ctrl/Cmd untuk memilih beberapa worker
                </Form.Text>
              </Form.Group>

              <div className="d-grid gap-2">
                <Button
                  variant="primary"
                  type="submit"
                  disabled={
                    loading || !fieldWorkers || fieldWorkers.length === 0
                  }
                >
                  {loading
                    ? "Memproses..."
                    : "Konfirmasi Pembayaran & Buat Jadwal"}
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => navigate("/dashboard/office")}
                >
                  Batal
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </>
  );
};

export default AssignFieldWorker;
