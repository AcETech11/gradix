"use client";

import { useCallback, useState } from "react";

export function usePasswordVisibility() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = useCallback(() => {
    setIsPasswordVisible((value) => !value);
  }, []);

  return {
    isPasswordVisible,
    passwordInputType: isPasswordVisible ? "text" : "password",
    togglePasswordVisibility,
  };
}
