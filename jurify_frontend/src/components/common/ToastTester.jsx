// components/common/ToastTester.jsx
import React from "react";
import { useToast } from "./ToastContext";

export default function ToastTester() {
  const { showToast } = useToast();

  return (
    <button
      onClick={() =>
        showToast({ type: "success", message: "Toast system works!" })
      }
      className="bg-blue-600 text-white px-4 py-2 rounded"
    >
      Trigger Toast
    </button>
  );
}