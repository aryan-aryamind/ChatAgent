import React from "react";
import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full space-y-10 bg-card border border-border p-10 rounded-xl shadow-xl">

        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-foreground">
            Privacy Policy
          </h1>
          <p className="text-text-secondary mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="prose dark:prose-invert max-w-none text-text-secondary space-y-8">

          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-foreground">
              Introduction
            </h2>
            <p>
              <strong>AI Chatbot Agent</strong> is an AI agent builder designed
              for sales, customer support, and user engagement automation.
            </p>
            <p>
              We understand that you care about your personal privacy. This
              Privacy Policy describes how AI Chatbot Agent collects, uses, and
              protects your personal data and outlines your privacy rights.
            </p>
            <p>
              Information privacy is an ongoing responsibility, and we may
              update this Privacy Notice periodically as our practices evolve.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-foreground">
              Contacting Us About Data Protection
            </h2>

            <p>
              AI Chatbot Agent is headquartered in India. If you have any
              questions about how we handle your personal data, you may contact
              our Privacy Team.
            </p>

            <p>
              <strong>AI Chatbot Agent</strong> <br />
              [Complete Address with Pin Code] <br />
              [City], [State] - [Pin Code], India
            </p>

            <p>
              Email:{" "}
              <a href="mailto:privacy@aichatbotagent.co.in">
                privacy@aichatbotagent.co.in
              </a>
            </p>
          </section>

          {/* Data Collection */}
          <section>
            <h2 className="text-2xl font-bold text-foreground">
              How We Collect and Use Your Personal Information
            </h2>

            <p>
              AI Chatbot Agent collects limited personal information from
              website visitors and customers including:
            </p>

            <ul>
              <li>Name</li>
              <li>Job title</li>
              <li>Employer name</li>
              <li>Work address</li>
              <li>Work email</li>
              <li>Work phone number</li>
              <li>PAN/GST details (for billing purposes)</li>
            </ul>

            <p>
              This information is used solely to provide our services and manage
              customer relationships. We do not sell personal information to
              third parties.
            </p>
          </section>

          {/* Website Usage */}
          <section>
            <h2 className="text-2xl font-bold text-foreground">
              Use of the AI Chatbot Agent Website
            </h2>

            <p>
              Like most websites, we automatically collect certain information
              and store it in log files. This may include:
            </p>

            <ul>
              <li>IP address</li>
              <li>Browser type</li>
              <li>Operating system</li>
              <li>Device type</li>
              <li>Pages visited and time spent</li>
            </ul>

            <p>
              This information helps us understand how visitors use our website
              so we can improve our platform and services.
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-foreground">
              Cookies and Tracking Technologies
            </h2>

            <p>
              AI Chatbot Agent uses cookies and similar technologies to improve
              user experience and analyze site traffic. You can control or
              disable cookies through your browser settings.
            </p>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-2xl font-bold text-foreground">
              Sharing Information with Third Parties
            </h2>

            <p>
              Personal data may be stored in secure databases hosted by trusted
              cloud infrastructure providers. These providers process data only
              for storage and operational purposes.
            </p>

            <p>
              We may disclose personal information when required by law,
              including compliance with the Information Technology Act, 2000
              and the Digital Personal Data Protection Act, 2023.
            </p>
          </section>

          {/* Cross Border */}
          <section>
            <h2 className="text-2xl font-bold text-foreground">
              Data Storage and Cross-Border Transfers
            </h2>

            <p>
              Your data is primarily processed and stored in India. However,
              certain services may require storage or processing in other
              jurisdictions such as the United States or European Union.
            </p>

            <p>
              AI Chatbot Agent ensures that all cross-border transfers comply
              with the Digital Personal Data Protection Act, 2023 and include
              appropriate safeguards.
            </p>
          </section>

          {/* Data Rights */}
          <section>
            <h2 className="text-2xl font-bold text-foreground">
              Data Principal Rights (DPDP Act, 2023)
            </h2>

            <p>Under Indian data protection law you have the right to:</p>

            <ul>
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your data</li>
              <li>Submit grievances regarding data processing</li>
              <li>Nominate a representative</li>
            </ul>

            <p>
              To exercise these rights please contact us at:
              privacy@aichatbotagent.co.in
            </p>
          </section>

          {/* Security */}
          <section>
            <h2 className="text-2xl font-bold text-foreground">
              Data Protection Mechanisms
            </h2>

            <p>We implement strong security measures including:</p>

            <ul>
              <li>Encryption (AES-256 for stored data)</li>
              <li>Secure infrastructure and access control</li>
              <li>Rate limiting and abuse prevention</li>
              <li>Domain allowlists for chatbot deployments</li>
              <li>Audit logging of data access</li>
            </ul>

            <p>
              We do not use customer data to train AI models. Our platform uses
              Retrieval-Augmented Generation (RAG) to ensure responses are
              generated securely without exposing private data.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-foreground">
              Data Storage and Retention
            </h2>

            <p>
              Personal data is stored for the duration of your relationship with
              AI Chatbot Agent and for additional periods required by law.
            </p>

            <ul>
              <li>Customer account data: duration of relationship + 7 years</li>
              <li>Transaction records: 7 years</li>
              <li>Marketing data: until consent withdrawal</li>
              <li>Chat logs: [to be defined]</li>
            </ul>
          </section>

          {/* Children */}
          <section>
            <h2 className="text-2xl font-bold text-foreground">
              Children's Data
            </h2>

            <p>
              AI Chatbot Agent does not knowingly collect data from individuals
              under 18 years of age. If such data is identified, it will be
              deleted promptly.
            </p>
          </section>

          {/* Policy Changes */}
          <section>
            <h2 className="text-2xl font-bold text-foreground">
              Changes to This Privacy Policy
            </h2>

            <p>
              We may update this Privacy Policy periodically to reflect changes
              in technology, legal requirements, or our practices.
            </p>

            <p>
              Updated versions will always be posted on this page with the
              revised "Last Updated" date.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-foreground">
              Questions or Complaints
            </h2>

            <p>
              If you have any questions, concerns, or complaints regarding this
              Privacy Policy, please contact:
            </p>

            <p>
              <strong>AI Chatbot Agent</strong> <br />
              [Complete Address] <br />
              [City], [State] - [Pin Code], India
            </p>

            <p>Email: privacy@aichatbotagent.co.in</p>
            <p>Grievance Officer: grievance@aichatbotagent.co.in</p>
          </section>

        </div>

        <div className="mt-8 pt-6 border-t border-border flex justify-center">
          <Link
            href="/"
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}