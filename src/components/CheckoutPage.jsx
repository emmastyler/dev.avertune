import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useCheckout } from "../lib/useSubscription";
import { useToast } from "../lib/Toast";
import { ArrowLeft, CreditCard, Wallet, Zap } from "lucide-react";

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const checkoutMutation = useCheckout();

  const plan = searchParams.get("plan");
  const billing = searchParams.get("billing");

  const [gateways, setGateways] = useState([]);
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [loadingGateways, setLoadingGateways] = useState(true);
  const [error, setError] = useState(null);

  // Fetch available payment gateways
  useEffect(() => {
    async function fetchGateways() {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch("/api/subscription/gateways", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load payment options");
        const data = await res.json();
        setGateways(data.gateways || []);
        const defaultGateway =
          data.gateways.find((g) => g.default) || data.gateways[0];
        setSelectedGateway(defaultGateway?.id);
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoadingGateways(false);
      }
    }
    fetchGateways();
  }, []);

  const handleProceed = async () => {
    if (!plan || !billing) {
      toast.error("Invalid plan or billing period");
      return;
    }
    if (!selectedGateway) {
      toast.error("Please select a payment method");
      return;
    }
    try {
      await checkoutMutation.mutateAsync({
        plan,
        billing_period: billing,
        payment_gateway: selectedGateway,
      });
      // The mutation will redirect to the returned URL
    } catch (err) {
      toast.error(err.message || "Checkout failed");
    }
  };

  if (loadingGateways) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div className="dot-loader">
          <span />
          <span />
          <span />
        </div>
        <span style={{ marginLeft: 12 }}>Loading payment options...</span>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        padding: "40px 20px",
      }}
    >
      <div className="container" style={{ maxWidth: 560 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "var(--ink-3)",
            marginBottom: 24,
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border2)",
            borderRadius: 24,
            padding: "clamp(24px,4vw,36px)",
          }}
        >
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
            Choose payment method
          </h1>
          <p style={{ color: "var(--ink-3)", marginBottom: 28 }}>
            Select how you’d like to pay. You can change it later in your
            billing settings.
          </p>

          {error && (
            <div
              style={{
                marginBottom: 20,
                padding: 12,
                background: "rgba(239,68,68,0.1)",
                borderRadius: 12,
                color: "#ef4444",
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginBottom: 32,
            }}
          >
            {gateways.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGateway(g.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 18px",
                  borderRadius: 14,
                  border: `1.5px solid ${selectedGateway === g.id ? "var(--green)" : "var(--border2)"}`,
                  background:
                    selectedGateway === g.id
                      ? "rgba(34,197,94,0.05)"
                      : "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                  fontFamily: "inherit",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    background: "var(--surface2)",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {g.icon === "stripe" ? (
                    <CreditCard size={20} />
                  ) : (
                    <Wallet size={20} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: 16 }}>{g.name}</p>
                  <p style={{ fontSize: 13, color: "var(--ink-3)" }}>
                    {g.description || `Pay with ${g.name}`}
                  </p>
                </div>
                {selectedGateway === g.id && (
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "var(--green)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6l3 3 5-6"
                        stroke="#000"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={handleProceed}
            disabled={checkoutMutation.isPending}
            className="btn-green"
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 14,
              fontSize: 16,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: checkoutMutation.isPending ? 0.7 : 1,
            }}
          >
            {checkoutMutation.isPending ? (
              <>
                <div className="dot-loader">
                  <span />
                  <span />
                  <span />
                </div>
                Redirecting...
              </>
            ) : (
              <>
                <Zap size={16} /> Proceed to payment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
