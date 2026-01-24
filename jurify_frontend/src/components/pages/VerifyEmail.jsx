import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();
    const [status, setStatus] = useState("idle"); // idle, verifying, success, error
    const [message, setMessage] = useState("Please click the button below to verify your email address.");

    const handleVerify = async () => {
        if (!token) {
            setStatus("error");
            setMessage("Invalid verification link.");
            return;
        }

        setStatus("verifying");
        setMessage("Verifying your email...");

        try {
            const response = await fetch(`http://localhost:8080/api/auth/verify-email?token=${token}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                setStatus("success");
                setMessage("Email verified successfully! You can close this tab and return to the registration page.");
            } else {
                const data = await response.json().catch(() => ({}));
                if (data.error === "Token already used") {
                    setStatus("success");
                    setMessage("Email already verified! You can close this tab and return to the registration page.");
                } else {
                    setStatus("error");
                    setMessage(data.error || "Verification failed. Link may be expired or invalid.");
                }
            }
        } catch (error) {
            console.error("Verification error", error);
            setStatus("error");
            setMessage("An error occurred during verification.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                {status === "idle" && (
                    <>
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-4xl text-blue-600">mail</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify Email</h2>
                        <p className="text-gray-500 mb-6">{message}</p>
                        <button
                            onClick={handleVerify}
                            className="bg-primary text-white px-8 py-3 rounded-xl hover:bg-primary/90 transition-colors font-bold shadow-lg"
                        >
                            Verify My Email
                        </button>
                    </>
                )}

                {status === "verifying" && (
                    <>
                        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Verifying Email</h2>
                        <p className="text-gray-500">{message}</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-4xl text-green-600">check_circle</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Verified!</h2>
                        <p className="text-gray-600 mb-6">{message}</p>
                        <button
                            onClick={() => window.close()}
                            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            Close Tab
                        </button>
                    </>
                )}

                {status === "error" && (
                    <>
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-4xl text-red-600">error</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Verification Failed</h2>
                        <p className="text-red-500 mb-6">{message}</p>
                        <button
                            onClick={() => navigate("/login")}
                            className="bg-primary text-white px-6 py-2 rounded-xl hover:bg-primary/90 transition-colors"
                        >
                            Go to Login
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
