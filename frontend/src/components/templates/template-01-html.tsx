export type Template01HTMLValues = {
  fromName: string;
  to: string;
  replyTo?: string | null;
  examiningOfficer: string;
  phone: string;
  appointmentTime: string;
  appointmentNumber: string;
  serialNumber: string;
  date: string;
};

export const Template01HTML = (values: Template01HTMLValues) => {
  return `
     <p>Dear Applicant,</p>

      <p>Pursuant to <strong>15 U.S.C. §§1051-1052</strong> and in accordance with <strong>TMEP §§1401.02, 806.01, and 1202</strong>, your trademark application is currently undergoing initial examination at the <strong>United States Patent and Trademark Office (USPTO)</strong>.</p>

      <p>Preliminary review indicates that additional or clarified classification details may be necessary to properly align your application with your actual commercial activity. As required under the Nice Agreement, all goods and services must be accurately classified under their appropriate international classes. Failure to comply may result in delays, limited protection, or further proceedings before the <strong>Trademark Trial and Appeal Board (TTAB)</strong>.</p>

      <p><strong>Why Classification Matters:</strong></p>

      <p>A properly filed multi-class application ensures that your mark receives protection across all commercial areas in which it is actively used. Accurate classification also expedites examination and reduces the risk of office actions or oppositions during the registration process.</p>

      <p>To ensure compliance and expedite review, a mandatory classification verification call has been scheduled with a USPTO-accredited trademark attorney. During this call, your attorney will:</p>
      <ul>
        <li>Review your submitted goods and services descriptions.</li>
        <li>Confirm applicable international classes under the Nice Agreement.</li>
        <li>Provide guidance on any amendments required prior to approval.</li>
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

      <p>Please contact your examining officer within the specified time frame.</p>

      <p>During the call, the attorney will verify ownership details, application specifics, and may discuss any potential conflicts or objections. This step is essential to move the application forward towards publication and final registration.</p>

      <p><strong>Note:</strong> This call is an important step in your U.S. trademark application process. It's part of the standard review procedure with the United States Patent and Trademark Office (USPTO) – Trademark Trial and Appeal Board (TTAB). The purpose is to confirm essential details and help move your filing forward without delays. If all required information is verified, your application could progress to the publication phase seamlessly.</p>

      <p>If the scheduled call is missed, there may be one opportunity for rescheduling. Failure to complete this process may result in abandonment or rejection of the application.</p>

      <p>Please <strong>"Confirm"</strong> receipt of this message and ensure that the scheduled verification is completed on time.</p>

      <p><strong>Regards,<br/>United States Patent & Trademark Office</strong></p>
  `;
};
