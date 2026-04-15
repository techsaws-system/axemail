export type Template02HTMLValues = {
  examiningOfficer: string;
  phone: string;
  appointmentTime: string;
  appointmentNumber: string;
  serialNumber: string;
  date: string;
};

export const Template02HTML = (values: Template02HTMLValues) => {
  return `
     <p>Dear Applicant,</p>

      <p>Pursuant to <strong>15 U.S.C. §§1051-1052</strong> and in accordance with <strong>TMEP §§1401.02, 806.01, and 1202</strong>, our records indicate that your trademark application has been marked as abandoned during the examination process at the <strong>United States Patent and Trademark Office (USPTO)</strong>.</p>

      <p>An application may be considered abandoned when required responses, documentation, or procedural steps are not completed within the time period established by the USPTO. This may occur due to missed correspondence, incomplete filings, or unresolved examination requirements.</p>

      <p><strong>Why This Matters:</strong></p>

      <p>An abandoned application means that your trademark is currently not moving forward toward registration, and the protection of your brand within the United States may be at risk. In certain situations, an abandoned application may still be revived or refiled, depending on the status of the case and the nature of the missed requirement.</p>

      <p>To review your case and determine the appropriate course of action, a mandatory verification call has been scheduled with a USPTO-accredited examining attorney. During this call, the attorney will:</p>
      <ul>
        <li>Review the status and reason for the abandonment of your application.</li>
        <li>Verify ownership and previously submitted application details.</li>
        <li>Advise whether the application can be revived or requires refiling.</li>
        <li>Provide guidance on any documentation or amendments needed to proceed.</li>
      </ul>

      <p><strong>Appointment Details:</strong></p>
      <ul>
        <li><strong>Examining Officer:</strong> ${values.examiningOfficer}</li>
        <li><strong>Phone:</strong> ${values.phone}</li>
        <li><strong>Appointment Time:</strong> ${values.appointmentTime}</li>
        <li><strong>Appointment Number:</strong> ${values.appointmentNumber}</li>
        <li><strong>Serial Number:</strong> ${values.serialNumber}</li>
        <li><strong>Date:</strong> ${values.date}</li>
      </ul>

      <p>Please contact the examining officer within the specified time frame.</p>

      <p>During the call, the attorney will verify the application details and discuss the available options to restore or proceed with your trademark filing. Completing this step promptly will help prevent further delays and may allow your application to continue toward registration.</p>

      <p><strong>Important Notice:</strong>\nThis call is part of the procedural review related to your trademark filing with the United States Patent and Trademark Office (USPTO). Timely verification will allow the examining attorney to determine the appropriate steps required to address the abandonment status.</p>

      <p>If the scheduled call is missed, there may be one opportunity to reschedule. Failure to complete this process may result in the permanent closure of the application record.</p>

      <p>Please <strong>"Confirm"</strong> receipt of this message and ensure that the verification call is completed within the scheduled time window.</p>

      <p><strong>Regards,<br/>United States Patent & Trademark Office</strong></p>
  `;
};
