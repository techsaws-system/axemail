"use client";

import dynamic from "next/dynamic";

import Loader from "@/components/partials/loader";

const Sender01 = dynamic(() => import("../../senders/sender-01"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[calc(100svh-90px)] flex-center">
      <Loader />
    </div>
  ),
});

export default function Sender01Wrapper() {
  return <Sender01 />;
}
