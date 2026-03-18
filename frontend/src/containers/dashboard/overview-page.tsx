import EmailSentCard from "@/components/includes/overview/email-sent-card";
import SMTPDeliveryHealthCard from "@/components/includes/overview/smtp-delivery-health-card";

function OverviewPage() {
  return (
    <main className="dashboard-layout-standard section-padding-standard">
      <div className="w-full grid md:grid-cols-2 grid-cols-1 md:gap-4 gap-8">
        <EmailSentCard />
        <SMTPDeliveryHealthCard />
      </div>
    </main>
  );
}

export default OverviewPage;
