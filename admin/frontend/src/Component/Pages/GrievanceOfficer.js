import React from "react";
import Title from "../extra/Title";

export default function GrievanceOfficer() {
  return (
    <div className="mainPage p-4">
      <div className="mb-4">
        <Title name="Grievance Officer & Legal Compliance (IT Rules 2021)" />
      </div>

      <div className="card shadow-sm border-0 p-4 mb-4">
        <h4 className="fw-bold mb-3">India IT Rules 2021 — Grievance Redressal Mechanism</h4>
        <p className="text-muted">
          In accordance with Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021,
          the name and contact details of the Grievance Officer who can be contacted for any complaints or concerns
          pertaining to content, privacy, copyright, or law enforcement inquiries are provided below:
        </p>

        <div className="row g-4 mt-2">
          <div className="col-md-6">
            <div className="p-3 border rounded bg-dark text-white">
              <h6 className="fw-bold text-primary mb-2">Designated Grievance Officer</h6>
              <p className="mb-1"><strong>Name:</strong> YouPeak Compliance & Legal Officer</p>
              <p className="mb-1"><strong>Designation:</strong> Grievance Redressal Officer</p>
              <p className="mb-1"><strong>Email:</strong> grievance@youpeak.in</p>
              <p className="mb-1"><strong>Alternate Email:</strong> legal@youpeak.in</p>
              <p className="mb-0"><strong>Response Timeframe:</strong> Acknowledged within 24 hours, resolved within 15 days.</p>
            </div>
          </div>

          <div className="col-md-6">
            <div className="p-3 border rounded bg-dark text-white">
              <h6 className="fw-bold text-success mb-2">Nodal Contact for Law Enforcement</h6>
              <p className="mb-1"><strong>Entity:</strong> YouPeak Digital Technologies Private Limited</p>
              <p className="mb-1"><strong>Jurisdiction:</strong> India (IT Act 2000 & Amendments)</p>
              <p className="mb-1"><strong>Nodal Email:</strong> nodal@youpeak.in</p>
              <p className="mb-0"><strong>Emergency Takedown Window:</strong> 24 hours for emergency content blocks.</p>
            </div>
          </div>
        </div>

        <hr className="my-4" />

        <h5 className="fw-bold mb-3">How to File a Content Takedown Notice</h5>
        <ol className="lh-lg">
          <li>Identify the specific Video ID, Channel ID, or URL on the YouPeak platform.</li>
          <li>Specify the nature of the violation (Copyright, Defamation, Anti-National Content, Privacy Breach, Pornographic/Obscene Content).</li>
          <li>Provide your full legal name, contact email, and proof of ownership or authorization.</li>
          <li>Send the formal written notice to <strong>grievance@youpeak.in</strong> or report directly via the Admin Moderation Queue.</li>
        </ol>
      </div>
    </div>
  );
}
