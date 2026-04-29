import { Metadata } from "next";
import { LoginClient } from "./client";

export const metadata: Metadata = {
  title: "登录 - Serein Blog",
  description: "登录到 Serein Blog",
};

export default function LoginPage() {
  return <LoginClient />;
}
