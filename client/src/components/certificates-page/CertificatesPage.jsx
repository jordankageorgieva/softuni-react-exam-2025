import React from 'react';
import './CertificatesPage.css';

export default function CertificatesPage() {
    const certificates = [
        { id: 1, name: 'Programming Basic - January 2025', organization: 'SoftUni', date: '2025-January', fileUrl: '/images/basics.jpg' },
        { id: 2, name: 'Programming Fundamentals with Python May 2025', organization: 'SoftUni', date: '2025-May', fileUrl: '/images/fundamentals.jpg' },
        { id: 3, name: 'Programming Advance with Python September 2025', organization: 'SoftUni', date: '2025-September', fileUrl: '/images/advance.jpg' },
        { id: 3, name: 'Python OOP October 2025', organization: 'SoftUni', date: '2025-October', fileUrl: '/images/oop.jpg' },
    ];

    return (
        <section id="certificates-page">
            <div className="container">
                <h1>Certificates</h1>
                <ul className="certificates-list">
                    {[...certificates].reverse().map(cert => (
                        <li key={cert.id} className="certificate-item">
                            <h2>
                                <a href={cert.fileUrl} target="_blank" rel="noopener noreferrer">
                                    {cert.name}
                                </a>
                            </h2>
                            <p>Issued by: {cert.organization}</p>
                            <p>Date: {cert.date}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}