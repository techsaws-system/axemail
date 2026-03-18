"use client";

import Sender01Wrapper from "@/components/includes/sender-01/sender-01-wrapper";

function Sender01Page() {
  return (
    <main className="dashboard-layout-standard section-padding-standard">
      <h1 className="text-3xl text-heading font-semibold">Email Sender</h1>

      <div className="w-full mt-4 mb-8 h-[2px] rounded-full bg-border" />

      <Sender01Wrapper />
    </main>
  );
}

export default Sender01Page;
