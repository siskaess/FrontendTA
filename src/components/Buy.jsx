// Buy.jsx
import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { Button, Table, Form } from "react-bootstrap";
import axios from "axios";

const Buy = () => {
  const { cart, clearCart, removeFromCart } = useCart();
  const [location, setLocation] = useState("");

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleBuy = async () => {
    if (!location.trim()) {
      alert("Please enter installation location");
      return;
    }

    try {
      const response = await axios.post("/api/payment/midtrans", {
        items: cart,
        total,
        location,
      });

      const { token } = response.data;

      window.snap.pay(token, {
        onSuccess: () => {
          alert("Payment successful!");
          clearCart();
        },
        onPending: () => alert("Waiting for payment..."),
        onError: () => alert("Payment failed."),
        onClose: () => alert("Payment popup closed."),
      });
    } catch (err) {
      console.error(err);
      alert("Error processing payment.");
    }
  };

  return (
    <div className="container mt-4">
      <h3>Your Cart</h3>
      {cart.length === 0 ? (
        <p>No items in cart.</p>
      ) : (
        <>
          <Table bordered hover>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.qty}</td>
                  <td>Rp{item.price.toLocaleString()}</td>
                  <td>Rp{(item.qty * item.price).toLocaleString()}</td>
                  <td>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <h5>Total: Rp{total.toLocaleString()}</h5>

          <Form.Group className="mb-3">
            <Form.Label>Installation Location</Form.Label>
            <Form.Control
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter installation location"
              required
            />
          </Form.Group>

          <Button variant="primary" onClick={handleBuy}>
            Proceed to Buy
          </Button>
        </>
      )}
    </div>
  );
};

export default Buy;
