import React from "react";
import Link from "next/link";

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl w-full space-y-10 bg-card border border-border p-10 rounded-xl shadow-xl">

                <div className="text-center">
                    <h1 className="text-4xl font-extrabold text-foreground">
                        Terms of Service
                    </h1>
                    <p className="text-text-secondary mt-2">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>
                </div>

                <div className="prose dark:prose-invert max-w-none text-text-secondary space-y-8">

                    <section>
                        <p>
                            THESE TERMS OF SERVICE GOVERN YOUR ACCESS AND USE OF THE SERVICES
                            PROVIDED BY <strong>AI Chatbot Agent</strong>. By signing up,
                            purchasing a subscription, or clicking acceptance, you agree to
                            be bound by this Agreement. If you are accepting on behalf of a
                            company or legal entity, you represent that you have authority to
                            bind that entity to this Agreement.
                        </p>

                        <p>
                            This Agreement is governed by the laws of India including the
                            Indian Contract Act, 1872, Information Technology Act, 2000,
                            Digital Personal Data Protection Act, 2023, and other applicable
                            regulations.
                        </p>
                    </section>

                    {/* Service */}
                    <section>
                        <h2 className="text-2xl font-bold text-foreground">1. The Service</h2>

                        <p>
                            AI Chatbot Agent provides a cloud-based artificial intelligence
                            platform that allows businesses to create AI agents for customer
                            support, sales automation, and user engagement.
                        </p>

                        <p>
                            Content uploaded or configured by customers through the platform
                            including training data, files, prompts, and configurations are
                            considered <strong>User Submissions</strong>.
                        </p>

                        <p>
                            The Service may also include templates, documentation, and other
                            materials to assist users in building AI agents.
                        </p>
                    </section>

                    {/* Subscription */}
                    <section>
                        <h2 className="text-2xl font-bold text-foreground">
                            2. Customer Subscription
                        </h2>

                        <p>
                            Customers may purchase subscriptions to access the Service
                            through the AI Chatbot Agent website. Each subscription is valid
                            for the duration defined in the selected plan.
                        </p>

                        <p>
                            Access to the Service is permitted only for individuals
                            authorized by the Customer and solely for internal business use.
                        </p>
                    </section>

                    {/* Ownership */}
                    <section>
                        <h2 className="text-2xl font-bold text-foreground">
                            3. Ownership and Intellectual Property
                        </h2>

                        <p>
                            AI Chatbot Agent retains all rights, title, and interest in the
                            Service, platform software, documentation, and related materials.
                            All intellectual property rights are protected under applicable
                            Indian laws including the Copyright Act, 1957 and the Trade Marks
                            Act, 1999.
                        </p>

                        <p>
                            Customers do not obtain ownership rights to the Service or
                            software.
                        </p>
                    </section>

                    {/* Restrictions */}
                    <section>
                        <h2 className="text-2xl font-bold text-foreground">
                            4. Use Restrictions
                        </h2>

                        <ul>
                            <li>Reverse engineer or attempt to access source code</li>
                            <li>Use the Service for unlawful activities</li>
                            <li>Attempt to disrupt the Service or infrastructure</li>
                            <li>Use the platform to build competing services</li>
                            <li>Transmit illegal or harmful content</li>
                        </ul>

                        <p>
                            Violations may result in suspension or termination of access.
                        </p>
                    </section>

                    {/* Third Party */}
                    <section>
                        <h2 className="text-2xl font-bold text-foreground">
                            5. Third-Party Services
                        </h2>

                        <p>
                            The Service may integrate with third-party services such as
                            messaging platforms, CRMs, and APIs. AI Chatbot Agent is not
                            responsible for third-party services and their use is subject to
                            their own terms and policies.
                        </p>
                    </section>

                    {/* Fees */}
                    <section>
                        <h2 className="text-2xl font-bold text-foreground">
                            6. Fees and Payment
                        </h2>

                        <p>
                            Customers must pay subscription fees as described on the pricing
                            page or order form. Payments may be processed through third-party
                            payment providers.
                        </p>

                        <ul>
                            <li>Fees are non-refundable except where required by law</li>
                            <li>Subscriptions may renew automatically</li>
                            <li>Failure to pay may result in suspension</li>
                        </ul>

                        <p>
                            Applicable taxes including GST may be added to invoices as
                            required under Indian law.
                        </p>
                    </section>

                    {/* Termination */}
                    <section>
                        <h2 className="text-2xl font-bold text-foreground">
                            7. Term and Termination
                        </h2>

                        <p>
                            This Agreement begins when a subscription is activated and
                            continues until terminated.
                        </p>

                        <p>
                            Either party may terminate the Agreement if the other party
                            materially breaches the terms and fails to resolve the breach
                            within thirty (30) days.
                        </p>

                        <p>
                            Upon termination, access to the Service will be revoked.
                        </p>
                    </section>

                    {/* Disclaimer */}
                    <section>
                        <h2 className="text-2xl font-bold text-foreground">
                            8. Warranty Disclaimer
                        </h2>

                        <p>
                            The Service is provided on an “as is” and “as available” basis.
                            AI Chatbot Agent does not guarantee uninterrupted or error-free
                            operation.
                        </p>
                    </section>

                    {/* Liability */}
                    <section>
                        <h2 className="text-2xl font-bold text-foreground">
                            9. Limitation of Liability
                        </h2>

                        <p>
                            To the maximum extent permitted by law, AI Chatbot Agent will not
                            be liable for indirect, incidental, or consequential damages
                            including loss of profits, revenue, or data.
                        </p>

                        <p>
                            Total liability will not exceed the amount paid by the Customer
                            during the previous twelve months.
                        </p>
                    </section>

                    {/* Data */}
                    <section>
                        <h2 className="text-2xl font-bold text-foreground">
                            10. Data and Privacy
                        </h2>

                        <p>
                            Customer data and user information will be processed according to
                            our Privacy Policy and in compliance with the Digital Personal
                            Data Protection Act, 2023.
                        </p>

                        <p>
                            AI Chatbot Agent does not use customer data to train general AI
                            models.
                        </p>
                    </section>

                    {/* Governing Law */}
                    <section>
                        <h2 className="text-2xl font-bold text-foreground">
                            11. Governing Law
                        </h2>

                        <p>
                            This Agreement shall be governed by the laws of India.
                        </p>

                        <p>
                            Any disputes arising from this Agreement will first be attempted
                            to be resolved through negotiation and may be referred to
                            arbitration under the Arbitration and Conciliation Act, 1996.
                        </p>

                        <p>
                            The courts of <strong>[City], India</strong> shall have
                            jurisdiction for matters not subject to arbitration.
                        </p>
                    </section>

                    {/* Contact */}
                    <section>
                        <h2 className="text-2xl font-bold text-foreground">
                            Contact Information
                        </h2>

                        <p>
                            <strong>AI Chatbot Agent</strong>
                        </p>

                        <p>
                            [Complete Registered Office Address] <br />
                            [City], [State] - [Pin Code], India
                        </p>

                        <p>Email: support@aichatbotagent.co.in</p>
                        <p>Billing: billing@aichatbotagent.co.in</p>
                        <p>Legal: legal@aichatbotagent.co.in</p>
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