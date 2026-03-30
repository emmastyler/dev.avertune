import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subscriptionApi } from "./subscriptionApi";
import { useAuth } from "../AuthContext";

export const SUB_KEYS = {
  plans: ["subscription", "plans"],
  me: ["subscription", "me"],
  gateways: ["subscription", "gateways"],
};

export function usePlans() {
  return useQuery({
    queryKey: SUB_KEYS.plans,
    queryFn: subscriptionApi.getPlans,
    staleTime: 10 * 60 * 1000, // 10 min
    retry: false,
  });
}

export function useMySubscription() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: SUB_KEYS.me,
    queryFn: subscriptionApi.getMySubscription,
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
    retry: false,
  });
}

export function useCheckout() {
  const { isAuthenticated } = useAuth();
  return useMutation({
    mutationFn: subscriptionApi.checkout,
    onSuccess: (data) => {
      if (data?.checkout_url) {
        window.location.href = data.checkout_url;
      }
    },
  });
}

export function usePortal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: subscriptionApi.getPortal,
    onSuccess: (data) => {
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("No portal URL returned");
      }
    },
    onError: (error) => {
      if (error.message?.includes("404") || error.response?.status === 404) {
        throw new Error("No active subscription found. Please upgrade first.");
      }
      throw error;
    },
  });
}

export function useCancel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: subscriptionApi.cancel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SUB_KEYS.me });
      qc.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

export function usePaymentGateways() {
  return useQuery({
    queryKey: SUB_KEYS.gateways,
    queryFn: subscriptionApi.getPaymentGateways,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

export function getPlanLabel(tier) {
  const map = {
    free: "Free",
    starter: "Starter",
    daily: "Daily",
    pro: "Pro",
    trial: "Trial",
  };
  return map[(tier || "").toLowerCase()] || tier || "Free";
}
