"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import React from "react";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!user) {
    router.push("/sign-in");
    return null;
  }

  const isAdmin = (user.publicMetadata as { role?: string })?.role === "admin";
  if (!isAdmin) {
    router.push("/");
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;