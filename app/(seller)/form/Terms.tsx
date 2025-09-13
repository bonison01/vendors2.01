'use client';

import React from 'react';

const TermsPage = () => {
  const handleDownload = () => {
    const termsContent = `
      Terms and Conditions
      ---------------------
      1. Introduction: These Terms and Conditions govern your use of the service.
      2. Acceptance of Terms: By using this service, you accept these terms.
      3. Limitations: We reserve the right to modify or terminate the service at any time.
      4. Privacy: We respect your privacy and handle your information with care.
      5. Liability: The service is provided "as is" and we are not liable for any issues.
      6. Governing Law: These terms are governed by the laws of the jurisdiction.

      For the full terms, please visit our website or contact support.
    `;

    const blob = new Blob([termsContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Terms_and_Conditions.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <div className="w-full max-w-2xl bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Terms and Conditions</h2>
        <div className="space-y-4">
          <p>
            <strong>1. Introduction</strong>: These Terms and Conditions govern your use of the service.
          </p>
          <p>
            <strong>2. Acceptance of Terms</strong>: By using this service, you accept these terms.
          </p>
          <p>
            <strong>3. Limitations</strong>: We reserve the right to modify or terminate the service at any time.
          </p>
          <p>
            <strong>4. Privacy</strong>: We respect your privacy and handle your information with care.
          </p>
          <p>
            <strong>5. Liability</strong>: The service is provided "as is" and we are not liable for any issues.
          </p>
          <p>
            <strong>6. Governing Law</strong>: These terms are governed by the laws of the jurisdiction.
          </p>
          {/* Add more terms as necessary */}

          <div className="mt-6 text-center">
            <button 
              onClick={handleDownload} 
              className="px-6 py-2 text-white bg-blue-500 rounded-lg">
              Download as PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
