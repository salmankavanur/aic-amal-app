// src/app/sponsorship/components/SponsorshipForm.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ActiveOption } from "../types";
import LocationSelector from "../LocationSelector";
import { useRouter } from "next/navigation";
import { useLoading } from "@/context/LoadingContext";

// Razorpay Type Definitions
interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    contact: string;
  };
  theme: {
    color: string;
  };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
    };
  }
}

interface SponsorshipFormProps {
  activeProgram: "Yatheem" | "Hafiz"; // Restricted to specific values
  activeOption: ActiveOption;
  onBack: () => void;
  onSubmitSuccess: () => void;
  onSubmit?: (formData: FormData) => Promise<void>; // Optional onSubmit prop
}

interface FormData {
  fullName: string;
  phoneNumber: string;
  type: "Yatheem" | "Hafiz"; // Restricted to Yatheem or Hafiz
  email: string;
  education:boolean;
  location: string;
  message: string;
  amount: number; // Added for Razorpay
  period: string; // Added for duration (e.g., "Monthly" or "Yearly")
}

export const SponsorshipForm = ({

  activeProgram,
  activeOption,
  onBack,
  onSubmit,
}: SponsorshipFormProps) => {
  const [form, setForm] = useState<FormData>({
    fullName: "",
    phoneNumber: "",
    type: activeProgram, // Initialized with activeProgram
    email: "",
    location: "",
    message: "",
    education:activeOption.includesEducation,
    amount: activeOption.finalAmount, // Initialized with finalAmount
    period: activeOption.duration, // Initialized with duration
  });
  const [isLoading, setIsLoading] = useState(false);

  const {startLoading,stopLoading}=useLoading();

  const router=useRouter()

  // Sync form with activeProgram and activeOption changes
  useEffect(() => {
    
    setForm((prev) => ({
      ...prev,
      type: activeProgram,
      amount: activeOption.finalAmount,
      period: activeOption.duration,
    }));
  }, [activeProgram, activeOption]);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startLoading();
    setIsLoading(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error("Failed to load Razorpay SDK");

      const response = await fetch("/api/donations/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json",
          'x-api-key': '9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d',
         },
        body: JSON.stringify({ amount: form.amount * 100 }), // Amount in paise
      });

      const orderData: { orderId: string; error?: string } = await response.json();
      if (!response.ok) throw new Error(orderData.error || "Order creation failed");

      const [district, panchayath] = form.location.split(", ").map((part) => part.trim());

  //     period: form.type === "Yatheem" 
  // ? `Sponsor-Yatheem${activeOption.includesEducation ? " with education" : ""}` 
  // : `Sponsor-Hafiz${activeOption.includesEducation ? " with education" : ""}`,

      return new Promise((resolve, reject) => {
        const options: RazorpayOptions = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_YourKeyIDHere",
          amount: form.amount * 100,
          currency: "INR",
          name: "AIC Alumni Donation",
          description: `Sponsorship for ${form.type} (${form.period})`,
          order_id: orderData.orderId,
          handler: async (response: RazorpayResponse) => {
            try {
              const paymentData = {
                amount: form.amount,
                name: form.fullName,
                phone: form.phoneNumber,
                type: form.type==="Yatheem" ?"Sponsor-Yatheem" :"Sponsor-Hafiz",
                program: activeProgram,
                period: form.period + (activeOption.includesEducation ? "(with education)" : ""), // Include period in payment data
                district: district,
                email:form.email,
                panchayat: panchayath,
                userId: "guest",
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              };

              startLoading();
              const saveResponse = await fetch("/api/sponsorships/create", {
                method: "POST",
                headers: { "Content-Type": "application/json",
                  'x-api-key': '9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d',
                 },
                body: JSON.stringify(paymentData),
              });

              const saveData: { id: string; error?: string } = await saveResponse.json();
              if (!saveResponse.ok) throw new Error(saveData.error || "Failed to save donation");


              // router.push(
              //   `/causes/success?donationId=${saveData.id}&amount=${form.amount}&name=${encodeURIComponent(
              //     form.fullName
              //   )}&phone=${form.phoneNumber}&type=${form.type}&district=${
              //     district || "Other"
              //   }&panchayat=${panchayath || ""}&paymentId=${response.razorpay_payment_id}&orderId=${
              //     response.razorpay_order_id
              //   }`
              // );

              router.push(`/sponsorship/success?donationId=${saveData.id}&amount=${form.amount}&name=${encodeURIComponent(form.fullName)}&phone=${form.phoneNumber}&type=${paymentData.type}&district=${district || "Other"}&panchayat=${panchayath || ""}&paymentId=${response.razorpay_payment_id}&orderId=${response.razorpay_order_id}`);

              stopLoading();

              // Call onSubmit if provided, then trigger success
              if (onSubmit) await onSubmit(form);
              // onSubmitSuccess();
              resolve({
                id: saveData.id,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
              });
            } catch (error) {
              reject(error);
            }
        
          },
          prefill: { name: form.fullName, contact: form.phoneNumber },
          theme: { color: "#10B981" },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      });
    } catch (error) {
      console.error("Payment error:", error);
      throw error; // Re-throw to let parent handle it
    } finally {
      setIsLoading(true);
      stopLoading();
    }
  };

  const handleLocationChange = (location: string) => {
    setForm((prev) => ({ ...prev, location }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-indigo-100">
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-all"
        >
          <svg
            className="w-6 h-6 text-indigo-800"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>
        <h3 className="text-2xl font-bold text-indigo-900">
          {activeProgram} Sponsorship Details
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100 shadow-sm">
          <h4 className="font-bold text-indigo-800 text-lg mb-2">
            Selected Sponsorship
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-indigo-600">Program:</span>
              <span className="font-medium text-indigo-900">{activeProgram}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-indigo-600">Duration:</span>
              <span className="font-medium text-indigo-900">{activeOption.duration}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-indigo-600">Type:</span>
              <span className="font-medium text-indigo-900">
                {activeOption.includesEducation ? "With Education" : "Standard"}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-indigo-200">
              <span className="text-indigo-700">Total Amount:</span>
              <span className="text-indigo-900">₹{activeOption.finalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-indigo-800 font-medium mb-2">Full Name</label>
            <input
              type="text"
              name="fullName"
              placeholder="Enter your full name"
              className="w-full p-3 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={form.fullName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <label className="block text-indigo-800 font-medium mb-2">Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              placeholder="Enter your phone number"
              className="w-full p-3 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={form.phoneNumber}
              onChange={handleInputChange}
              pattern="[0-9]{10}"
              required
            />
          </div>

          <div>
            <label className="block text-indigo-800 font-medium mb-2">Email (Optional)</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email address"
              className="w-full p-3 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={form.email}
              onChange={handleInputChange}
            />
          </div>

          <LocationSelector
            selectedLocation={form.location}
            onLocationChange={handleLocationChange}
          />

          <div>
            <label className="block text-indigo-800 font-medium mb-2">Message (Optional)</label>
            <textarea
              name="message"
              placeholder="Add a personal message (Optional)"
              rows={3}
              className="w-full p-3 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={form.message}
              onChange={handleInputChange}
            />
          </div>

          <div className="pt-2">
            <motion.button
              type="submit"
              disabled={isLoading || !form.fullName || !form.phoneNumber || !form.location}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </span>
              ) : (
                "Complete Sponsorship"
              )}
            </motion.button>
          </div>

          <div className="flex items-center justify-center mt-4">
            <div className="bg-indigo-50 p-2 rounded-full mr-3">
              <svg
                className="w-5 h-5 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <p className="text-xs text-gray-600">
              Your information is secured with industry-standard encryption
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};