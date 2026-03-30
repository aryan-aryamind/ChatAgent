import React from "react";
import Link from "next/link";

export default function CookiePolicy() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl w-full space-y-10 bg-card border border-border p-10 rounded-xl shadow-xl">

                <div className="text-center">
                    <h1 className="text-4xl font-extrabold text-foreground">
                        Cookie Policy
                    </h1>
                    <p className="text-text-secondary mt-2">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>
                </div>

                <div className="prose dark:prose-invert max-w-none text-text-secondary space-y-8">

                    {/* Introduction */}
                    <section>
                        <h2 className="text-2xl font-bold text-foreground">Introduction</h2>

                        <p>
                            TheChatAgent believes in transparency about how data is
                            collected and used. This Cookie Policy explains how and when
                            cookies are used when you visit our website or use our services.
                        </p>

                        <p>
                            This policy is published in compliance with Indian laws including
                            the Information Technology Act, 2000, the Digital Personal Data
                            Protection Act, 2023, and related regulations.
                        </p>
                    </section>

                    {/* What is a Cookie */}
                    <section>
                        <h2 className="text-2xl font-bold text-foreground">
                            What is a Cookie?
                        </h2>

                        <p>
                            Cookies are small text files stored on your computer or mobile
                            device when you visit a website. They allow websites to remember
                            your preferences, login sessions, and interactions.
                        </p>

                        <p>
                            Session cookies last only while your browser is open, while
                            persistent cookies remain stored until they expire or are
                            deleted.
                        </p>
                    </section>

                    {/* Use of Cookies */}
                    <section>
                        <h2 className="text-2xl font-bold text-foreground">
                            Does TheChatAgent Use Cookies?
                        </h2>

                        <p>
                            Yes. TheChatAgent uses cookies and similar technologies such
                            as web beacons, pixels, and local storage to improve user
                            experience, analyze traffic, and enhance security.
                        </p>

                        <p>
                            We may also use third-party cookies such as analytics tools to
                            understand how users interact with our platform.
                        </p>
                    </section>

                    {/* How Cookies Are Used */}
                    <section>
                        <h2 className="text-2xl font-bold text-foreground">
                            How We Use Cookies
                        </h2>

                        <p>Cookies may be used for the following purposes:</p>

                        <ul>
                            <li>Remembering login sessions</li>
                            <li>Improving website performance</li>
                            <li>Personalizing user experience</li>
                            <li>Security and fraud detection</li>
                            <li>Analytics and product improvements</li>
                        </ul>
                    </section>

                    {/* Categories */}
                    <section>
                        <h2 className="text-2xl font-bold text-foreground">
                            Categories of Cookies
                        </h2>

                        <h3 className="text-lg font-semibold text-foreground">
                            Authentication
                        </h3>
                        <p>
                            These cookies identify you when you log in and help us provide
                            personalized experiences.
                        </p>

                        <h3 className="text-lg font-semibold text-foreground">Security</h3>
                        <p>
                            Security cookies help detect suspicious activities and protect
                            accounts from unauthorized access.
                        </p>

                        <h3 className="text-lg font-semibold text-foreground">
                            Preferences
                        </h3>
                        <p>
                            These cookies remember user preferences such as language and
                            interface settings.
                        </p>

                        <h3 className="text-lg font-semibold text-foreground">
                            Analytics
                        </h3>
                        <p>
                            Analytics cookies help us understand website performance and user
                            behavior so we can improve our services.
                        </p>

                        <h3 className="text-lg font-semibold text-foreground">
                            Marketing
                        </h3>
                        <p>
                            Marketing cookies may be used to measure campaign effectiveness
                            and deliver relevant marketing content.
                        </p>
                    </section>

                    {/* Legal Basis */}
                    <section>
                        <h2 className="text-2xl font-bold text-foreground">
                            Legal Basis for Using Cookies
                        </h2>

                        <p>
                            Under the Digital Personal Data Protection Act, 2023, cookies may
                            be used under the following bases:
                        </p>

                        <ul>
                            <li>
                                <strong>Necessary Cookies:</strong> Required for website
                                functionality.
                            </li>
                            <li>
                                <strong>Analytics Cookies:</strong> Used with your consent to
                                improve performance.
                            </li>
                            <li>
                                <strong>Marketing Cookies:</strong> Used with your explicit
                                consent for advertising purposes.
                            </li>
                        </ul>
                    </section>

                    {/* Managing Cookies */}
                    <section>
                        <h2 className="text-2xl font-bold text-foreground">
                            Managing and Deleting Cookies
                        </h2>

                        <p>
                            You can manage your cookie preferences through our website cookie
                            manager or through your browser settings.
                        </p>

                        <p>
                            Disabling cookies may affect certain functionality of our
                            website.
                        </p>
                    </section>

                    {/* Data Retention */}
                    <section>
                        <h2 className="text-2xl font-bold text-foreground">
                            Data Retention
                        </h2>

                        <ul>
                            <li>Necessary cookies: Session or up to 1 year</li>
                            <li>Analytics cookies: Up to 2 years</li>
                            <li>Marketing cookies: Up to 2 years</li>
                        </ul>

                        <p>
                            After this period, data is deleted or anonymized automatically.
                        </p>
                    </section>

                    {/* Children's Data */}
                    <section>
                        <h2 className="text-2xl font-bold text-foreground">
                            Children's Data
                        </h2>

                        <p>
                            Our services are not directed toward children under the age of
                            18. We do not knowingly collect personal data from children
                            through cookies.
                        </p>
                    </section>

                    {/* Updates */}
                    <section>
                        <h2 className="text-2xl font-bold text-foreground">
                            Updates to this Cookie Policy
                        </h2>

                        <p>
                            We may update this Cookie Policy from time to time. Any updates
                            will be posted on this page with an updated “Last Updated” date.
                        </p>
                    </section>

                    {/* Contact */}
                    <section>
                        <h2 className="text-2xl font-bold text-foreground">
                            Contact Information
                        </h2>

                        <p>
                            <strong>TheChatAgent</strong>
                        </p>

                        <p>
                            C-35, Tirupati Sahibag, Village Panchot, <br />
                            Mehsana, Gujarat, 384205
                        </p>

                        <p>Email: shwetatechnologie@gmail.com</p>
                        <p>Grievance Officer: shwetatechnologie@gmail.com</p>
                        <p>Phone: +91 63561 37551</p>
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