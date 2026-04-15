export type Template03HTMLValues = {
    serialNumber: string;
    examiningOfficer: string;
    phone: string;
    appointmentReference: string;
    availability: string;
    date: string;
};

export const Template03HTML = (values: Template03HTMLValues) => {
    return `
     <div style="text-align:center; margin-bottom:28px;">

      <a href="https://www.uspto.gov" target="_blank"
         style="text-decoration:underline; color:#0000FF;">
        <div style="
          font-family: 'Times New Roman', Georgia, serif;
          font-size:20px;
          font-weight:600;
          letter-spacing:0.3px;
          margin-bottom:6px;
        ">
          United States Patent and Trademark Office (USPTO)
        </div>
      </a>

      <div style="
        font-family: 'Times New Roman', Georgia, serif;
        font-size:16px;
        font-weight:500;
        color:#333;
        margin-bottom:10px;
      ">
        Initial Trademark Examination Notice
      </div>

      <div style="
        font-family: 'Times New Roman', Georgia, serif;
        font-size:14px;
        color:#444;
      ">
        U.S. Application Serial No: <strong>${values.serialNumber}</strong>
      </div>

    </div>
    
     <p>Dear Applicant,</p>

      <p>This notice confirms that your trademark application has been entered into initial examination status within the <strong>United States Patent and Trademark Office (USPTO)</strong> system. Your application is being actively reviewed and represented by <strong>${values.examiningOfficer}</strong>, who will manage all correspondence, required filings, and any necessary amendments on your behalf. This review process typically requires <strong>6 - 8 months</strong> for completion. During this period, you may receive an <strong>Office Action</strong> requiring clarification, amendment, or submission of additional documentation. Timely compliance is necessary to maintain the <strong>active status of your application</strong>.</p>

      <p>Pursuant to the <strong>Lanham Act (15 U.S.C. §1051 et seq.)</strong> and applicable <strong>USPTO regulations</strong>, incomplete or inaccurate information may result in the issuance of an <strong>Office Action</strong> and, if not properly addressed within the prescribed statutory period, could lead to <strong>Abandonment of the application</strong>.</p>

      <p>To continue the examination process toward <strong>publication and potential registration, verification and attestation</strong> are required from the listed applicant or an authorized representative.</p>

      <p><strong>Verification Requirements</strong>\n<strong>During the verification call, the following information will be confirmed:</strong></p>
      <ul>
        <li>Legal owner's name and address.</li>
        <li>Federal trademark application serial number.</li>
        <li>Duration of business operations.</li>
        <li>Nature of the goods and/or services identified in the application.</li>
        <li>Owner's position or authority to act on behalf of the applicant.</li>
      </ul>

      <p><strong>Required Action:</strong>\nPlease contact the assigned officer to complete the verification process.</p>
      <ul>
        <li><strong>Assigned Officer:</strong> ${values.examiningOfficer}</li>
        <li><strong>Telephone Number:</strong> ${values.phone}</li>
        <li><strong>Appointment Reference:</strong> ${values.appointmentReference}</li>
        <li><strong>Availability:</strong> ${values.availability}</li>
        <li><strong>Date:</strong> ${values.date}</li>
      </ul>

      <p><strong>Verification Call Purpose</strong>\n<strong>The verification call will be used to:</strong></p>
      <ul>
        <li>Confirm ownership and application information.</li>
        <li>Review classification and filing compliance.</li>
        <li>Address any outstanding procedural matters, if applicable.</li>
      </ul>

       <p><strong>Important Information</strong></p>
      <ul>
        <li>If verification is not completed, the application may be placed into <strong>suspended status</strong>.</li>
        <li>One request to reschedule may be considered if submitted in writing prior to the scheduled time and demonstrates good cause, in accordance with <strong>37 C.F.R. § 2.146</strong>.</li>
        <li>Failure to complete verification within the permitted timeframe may result in <strong>abandonment of the application</strong>.</li>
        <li>Please reference your Trademark Application Serial Number during the call.</li>
        <li>Verification must be completed by <strong>live telephone communication</strong>.</li>
      </ul>

      <p><strong>Sincerely,<br/>United States Patent and Trademark Office (USPTO)</strong></p>
  `;
};
