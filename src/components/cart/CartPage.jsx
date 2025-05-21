import React, { useState, useEffect } from "react";
import { useCart } from "../../context/CartContext";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Form,
  Image,
  Alert,
  FloatingLabel,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import {
  Trash,
  PlusCircle,
  DashCircle,
  CreditCard,
  Tools,
  GeoAlt,
  CalendarEvent,
  Clock,
} from "react-bootstrap-icons";
import Header from "../Header";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const CartPage = ({ userData, onLogout }) => {
  const { cart, removeFromCart, updateQuantity, clearCart, cartTotal } =
    useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [cameraCount, setCameraCount] = useState(0);
  const [installationFee, setInstallationFee] = useState(0);
  const [installationLocation, setInstallationLocation] = useState("");
  const [locationError, setLocationError] = useState("");
  const [installationDate, setInstallationDate] = useState(null);
  const [installationTime, setInstallationTime] = useState("");
  const [dateTimeError, setDateTimeError] = useState("");
  const [installmentHidden, setInstallmentHidden] = useState(true);
  const navigate = useNavigate();

  const INSTALLATION_FEE_PER_CAMERA = 200000;
  const [isSnapReady, setIsSnapReady] = useState(false);

  useEffect(() => {
    const checkSnap = setInterval(() => {
      if (window.snap) {
        setIsSnapReady(true);
        clearInterval(checkSnap);
      }
    }, 1000);

    return () => clearInterval(checkSnap);
  }, []);

  const isCameraProduct = (item) => {
    return item && item.type && item.type.toLowerCase() === "camera";
  };

  useEffect(() => {
    const camerasInCart = cart.filter((item) => isCameraProduct(item));
    const totalCameras = camerasInCart.reduce(
      (total, item) => total + item.qty,
      0
    );
    setCameraCount(totalCameras);
    const newInstallationFee =
      totalCameras > 0 ? INSTALLATION_FEE_PER_CAMERA * totalCameras : 0;
    setInstallationFee(newInstallationFee);
  }, [cart]);

  const formatRupiah = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const totalWithInstallation = cartTotal + installationFee;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!isSnapReady) {
      setPaymentError("Payment system is not ready yet. Please try again.");
      return;
    }

    setLocationError("");
    setDateTimeError("");
    setPaymentError(null);

    if (!installmentHidden) {
      let firstErrorElementId = null;
      if (!installationLocation.trim()) {
        setLocationError("Please provide an installation location.");
        if (!firstErrorElementId) firstErrorElementId = "installation-location";
      }
      if (!installationDate) {
        setDateTimeError("Please select an installation date.");
        if (!firstErrorElementId)
          firstErrorElementId = "installation-date-time";
      }
      if (!installationTime.trim()) {
        setDateTimeError((prev) =>
          prev
            ? prev + " Please also select an installation time."
            : "Please select an installation time."
        );
        if (!firstErrorElementId)
          firstErrorElementId = "installation-date-time";
      }

      if (locationError || dateTimeError) {
        if (firstErrorElementId) {
          document
            .getElementById(firstErrorElementId)
            .scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }
    }

    try {
      setIsProcessing(true);

      let products = cart.map((item) => item.name);
      let prices = cart.map((item) => item.price);
      let quantities = cart.map((item) => item.qty);

      if (!installmentHidden) {
        products.push(`Jasa Pasang`);
        prices.push(INSTALLATION_FEE_PER_CAMERA);
        quantities.push(cameraCount);
      }

      const transactionPayload = {
        user: userData?.email || "Customer",
        products: products,
        prices: prices,
        qty: quantities,
        totalPrice: totalWithInstallation,
        status: "pending",
        date: new Date().toISOString(),
        location: !installmentHidden ? installationLocation : "Pickup at store",
        installationDate: !installmentHidden ? installationDate : null,
        installationTime: !installmentHidden ? installationTime : null,
        paymentStatus: "pending",
        paymentDetails: {},
        installationService: !installmentHidden,
      };

      const transactionResponse = await axios.post(
        "/api/transactions",
        transactionPayload
      );

      const transactionId =
        transactionResponse.data?.transactionId ||
        transactionResponse.data?._id;
      if (!transactionId) {
        throw new Error("Failed to get Transaction ID from the server.");
      }

      if (!installmentHidden) {
        try {
          console.log("userData",userData)
          const schedulePayload = {
            customer: userData?.email || "Customer",
            transaction: transactionId,
            status: "pending",
            date: installationDate,
            time: installationTime,
          };
          await axios.post("/api/schedules", schedulePayload);
        } catch (scheduleError) {
          console.error(
            "Failed to auto-create schedule:",
            scheduleError.response?.data || scheduleError.message
          );
        }
      }

      const midtransPayload = {
        transaction_details: {
          order_id: transactionId,
          gross_amount: parseInt(totalWithInstallation),
        },
        customer_details: {
          first_name: userData?.name || "Customer",
          email: userData?.email || "noemail@example.com",
          phone: userData?.phone || "081234567890",
        },
        item_details: [
          ...cart.map((item) => ({
            id: item._id,
            price: parseInt(item.price),
            quantity: item.qty,
            name: item.name,
          })),
          ...(cameraCount > 0
            ? [
                {
                  id: "INSTALLATION",
                  price: parseInt(INSTALLATION_FEE_PER_CAMERA),
                  quantity: cameraCount,
                  name: "Jasa Pemasangan Kamera",
                },
              ]
            : []),
        ],
      };

      const snapResponse = await axios.post(
        `/api/payments/create/${transactionId}`,
        midtransPayload
      );

      if (!snapResponse.data.data?.token) {
        throw new Error("Did not receive payment token from server");
      }
      const snapToken = snapResponse.data.data.token;

      if (!window.snap) {
        throw new Error("Payment system (Snap) is not ready");
      }

      window.snap.pay(snapToken, {
        onSuccess: async (result) => {
          try {
            // await axios.put(`/api/transactions/${transactionId}/payment`, {
            //   paymentId: result.transaction_id || result.order_id,
            //   paymentStatus: "success",
            //   paymentDetails: result,
            // });

            //pengurangan stok!!
            await axios.put(`/api/transactions/confirm/${transactionId}`);

            clearCart();
            navigate("/payment-success");
          } catch (error) {
            setPaymentError(
              "Payment successful but failed to update status. Please contact admin."
            );
          }
        },
        onPending: async (result) => {
          try {
            // await axios.put(`/api/transactions/${transactionId}/payment`, {
            //   paymentId: result.transaction_id || result.order_id,
            //   paymentStatus: "pending",
            //   paymentDetails: result,
            // });
            clearCart();
            navigate(`/payment-instructions/${transactionId}`, {
              state: {
                bank:
                  result.va_numbers?.[0]?.bank || result.permata_va_number
                    ? "Permata"
                    : result.payment_type,
                vaNumber:
                  result.va_numbers?.[0]?.va_number ||
                  result.permata_va_number ||
                  result.bill_key ||
                  result.biller_code,
                amount: result.gross_amount,
                orderId: result.order_id,
                expiryTime: result.expiry_time,
                paymentCode: result.payment_code,
                store: result.store,
              },
            });
          } catch (error) {}
        },
        onError: async (error) => {
          // try {
          //   await axios.put(`/api/transactions/${transactionId}/payment`, {
          //     paymentStatus: "failed",
          //     paymentDetails: error,
          //   });
          // } catch (updateError) {}
          setPaymentError(error.message || "Payment failed. Please try again.");
        },
        onClose: () => {
          setIsProcessing(false);
        },
      });
    } catch (err) {
      setPaymentError(
        err.response?.data?.message ||
          err.message ||
          "Error processing checkout. Please try again."
      );
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Header userData={userData} onLogout={onLogout} />
      <Container className="py-5">
        <h2 className="mb-4">Your Shopping Cart</h2>

        {paymentError && (
          <Alert variant="danger" className="mb-4">
            {paymentError}
          </Alert>
        )}

        {cart.length > 0 ? (
          <Row>
            <Col lg={8}>
              <Card className="shadow-sm mb-4">
                <Card.Body>
                  <Table responsive className="table-borderless">
                    <thead>
                      <tr className="text-muted">
                        <th style={{ width: "100px" }}>Product</th>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item) => (
                        <tr key={item._id}>
                          <td>
                            <div
                              style={{ width: "70px", height: "70px" }}
                              className="bg-light rounded d-flex align-items-center justify-content-center"
                            >
                              {item.image ? (
                                <Image
                                  src={`${item.image}`}
                                  alt={item.name}
                                  style={{
                                    maxWidth: "100%",
                                    maxHeight: "100%",
                                    objectFit: "contain",
                                  }}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = "none";
                                    const parentDiv = e.target.parentNode;
                                    if (parentDiv) {
                                      parentDiv.innerHTML =
                                        '<span class="text-muted small">No image</span>';
                                    }
                                  }}
                                />
                              ) : (
                                <span className="text-muted small">
                                  No image
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="align-middle">
                            <Link
                              to={`/products/${item._id}`}
                              className="text-decoration-none text-dark"
                            >
                              {item.name}
                            </Link>
                          </td>
                          <td className="align-middle">
                            {formatRupiah(item.price)}
                          </td>
                          <td className="align-middle">
                            <div className="d-flex align-items-center">
                              <Button
                                variant="link"
                                className="p-0"
                                onClick={() =>
                                  updateQuantity(
                                    item._id,
                                    Math.max(1, item.qty - 1)
                                  )
                                }
                              >
                                <DashCircle />
                              </Button>
                              <Form.Control
                                type="number"
                                min="1"
                                value={item.qty}
                                onChange={(e) =>
                                  updateQuantity(
                                    item._id,
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                style={{ width: "60px" }}
                                className="mx-2 text-center"
                              />
                              <Button
                                variant="link"
                                className="p-0"
                                onClick={() =>
                                  updateQuantity(item._id, item.qty + 1)
                                }
                              >
                                <PlusCircle />
                              </Button>
                            </div>
                          </td>
                          <td className="align-middle fw-bold">
                            {formatRupiah(item.price * item.qty)}
                          </td>
                          <td className="align-middle">
                            <Button
                              variant="link"
                              className="text-danger p-0"
                              onClick={() => removeFromCart(item._id)}
                            >
                              <Trash />
                            </Button>
                          </td>
                        </tr>
                      ))}

                      {!installmentHidden && (
                        <tr className="bg-light">
                          <td>
                            <div
                              style={{ width: "70px", height: "70px" }}
                              className="rounded d-flex align-items-center justify-content-center"
                            >
                              <Tools size={28} color="#95b8d1" />
                            </div>
                          </td>
                          <td className="align-middle">
                            <strong>Jasa Pemasangan Kamera</strong>
                            <div className="text-muted small">
                              Biaya pemasangan untuk {cameraCount} kamera
                            </div>
                          </td>
                          <td className="align-middle">
                            {formatRupiah(INSTALLATION_FEE_PER_CAMERA)}
                          </td>
                          <td className="align-middle">{cameraCount}</td>
                          <td className="align-middle fw-bold">
                            {formatRupiah(installationFee)}
                          </td>
                          <td className="align-middle"></td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>

              <div className="d-flex justify-content-between mb-5">
                <Button
                  variant="outline-secondary"
                  onClick={() => navigate("/")}
                >
                  Continue Shopping
                </Button>
                <Button variant="outline-danger" onClick={clearCart}>
                  Clear Cart
                </Button>
              </div>
            </Col>

            <Col lg={4}>
              <Card className="shadow-sm mb-4">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">Order Summary</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex justify-content-between mb-2">
                    <span>
                      Subtotal (
                      {cart.reduce((total, item) => total + item.qty, 0)} items)
                    </span>
                    <span>{formatRupiah(cartTotal)}</span>
                  </div>

                  {!installmentHidden && (
                    <div className="d-flex justify-content-between mb-2">
                      <span>Installation Service ({cameraCount} cameras)</span>
                      <span>{formatRupiah(installationFee)}</span>
                    </div>
                  )}

                  <hr />
                  <div className="d-flex justify-content-between mb-4">
                    <strong>Total</strong>
                    <strong className="text-primary">
                      {!installmentHidden
                        ? formatRupiah(totalWithInstallation)
                        : formatRupiah(cartTotal)}
                    </strong>
                  </div>

                  {cameraCount > 0 && (
                    <div className="d-flex justify-content-between mb-4">
                      <Form.Check
                        type="checkbox"
                        id="installment-checkbox"
                        label="Installation Service"
                        checked={!installmentHidden}
                        onChange={(e) => {
                          setInstallmentHidden(!e.target.checked);
                        }}
                      />
                    </div>
                  )}

                  {!installmentHidden && (
                    <>
                      <div className="mb-3" id="installation-location">
                        <FloatingLabel
                          controlId="installationAddress"
                          label={
                            <span>
                              <GeoAlt className="me-1" /> Installation Location
                            </span>
                          }
                          className="mb-3"
                        >
                          <Form.Control
                            as="textarea"
                            placeholder="Enter the address where cameras will be installed"
                            style={{ height: "100px" }}
                            value={installationLocation}
                            onChange={(e) => {
                              setInstallationLocation(e.target.value);
                              if (e.target.value.trim()) setLocationError("");
                            }}
                            isInvalid={!!locationError}
                          />
                          <Form.Control.Feedback type="invalid">
                            {locationError}
                          </Form.Control.Feedback>
                          <Form.Text className="text-muted small">
                            Please provide complete address for camera
                            installation.
                          </Form.Text>
                        </FloatingLabel>
                      </div>

                      <div className="mb-3" id="installation-date-time">
                        <Row>
                          <Col md={6}>
                            <Form.Group controlId="installationDate">
                              <Form.Label>
                                <CalendarEvent className="me-1" /> Date
                              </Form.Label>
                              <DatePicker
                                selected={installationDate}
                                onChange={(date) => {
                                  setInstallationDate(date);
                                  if (date) setDateTimeError("");
                                }}
                                className={`form-control ${
                                  dateTimeError && !installationDate
                                    ? "is-invalid"
                                    : ""
                                }`}
                                dateFormat="dd/MM/yyyy"
                                placeholderText="Select date"
                                minDate={new Date()}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group controlId="installationTime">
                              <Form.Label>
                                <Clock className="me-1" /> Time
                              </Form.Label>
                              <Form.Control
                                type="time"
                                value={installationTime}
                                onChange={(e) => {
                                  setInstallationTime(e.target.value);
                                  if (e.target.value) setDateTimeError("");
                                }}
                                className={`${
                                  dateTimeError && !installationTime.trim()
                                    ? "is-invalid"
                                    : ""
                                }`}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                        {dateTimeError && (
                          <div className="d-block invalid-feedback mt-1">
                            {dateTimeError}
                          </div>
                        )}
                        <Form.Text className="text-muted small mt-2 d-block">
                          Select preferred date and time for installation.
                        </Form.Text>
                      </div>
                    </>
                  )}

                  <Button
                    variant="primary"
                    className="w-100 mt-3"
                    onClick={handleCheckout}
                    disabled={isProcessing || !isSnapReady}
                    style={{
                      backgroundColor: "#28a745",
                      borderColor: "#28a745",
                    }}
                  >
                    {isProcessing ? (
                      <>Processing Payment...</>
                    ) : !isSnapReady ? (
                      <>Loading Payment System...</>
                    ) : (
                      <>
                        <CreditCard className="me-2" /> Proceed to Checkout
                      </>
                    )}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        ) : (
          <Card className="text-center p-5 shadow-sm">
            <h4>Your cart is empty</h4>
            <p className="text-muted mb-4">
              Looks like you haven't added any products to your cart yet.
            </p>
            <div>
              <Button
                variant="primary"
                onClick={() => navigate("/")}
                style={{
                  backgroundColor: "#95b8d1",
                  borderColor: "#95b8d1",
                }}
              >
                Continue Shopping
              </Button>
            </div>
          </Card>
        )}
      </Container>
    </>
  );
};

export default CartPage;
