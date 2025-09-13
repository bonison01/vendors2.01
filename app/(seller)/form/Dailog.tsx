'use client';

import React from 'react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const Dialog: React.FC<DialogProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // Define the download function here
  const handleDownload = () => {
    const termsContent = `
      Terms and Conditions
      ---------------------
      Date: 30 July, 2025
      Company Name: Justmateng Service Pvt. Ltd

      By engaging with our delivery services, you ("customer", "you", or "your") agree to the following Terms and Conditions regarding the collection and use of your personal data.

      1. Purpose of Data Collection
      We collect and process your personal information for the following purposes:
      - To facilitate Cash on Delivery (COD) remittance accurately and securely.
      - To ensure proper handling and delivery of your packages.
      - To verify the identity and address of the sender and recipient, reducing the risk of fraud.
      - To comply with applicable financial and logistical regulations.

      2. Data Use and Storage
      - Your data will be used solely for the purposes mentioned above.
      - We store your information securely and restrict access to authorized personnel only.
      - Bank account details are handled with strict confidentiality and in compliance with applicable data protection regulations.

      3. Data Sharing
      We do not sell or share your data with third parties, except:
      - When required by law or legal process.
      - With banking partners to complete COD remittances.

      4. Your Consent
      By using our services, you give explicit consent for us to collect, store, and use your personal and banking information as outlined in this document.

      5. Your Rights
      You have the right to:
      - Request access to your personal data.
      - Ask for corrections or updates.
      - Withdraw consent (subject to service limitations).
      - Request deletion of your data, unless retention is legally required.

      To exercise any of these rights, please contact us at:
      Email: justmateng@gmail.com
      Phone: 8798009341

      6. Data Retention
      We retain your data only as long as necessary to fulfill the purposes described or as required by law.

      7. Changes to This Policy
      We may update these terms from time to time. Continued use of our services after changes constitutes acceptance of the updated terms.
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-zinc-800 text-white p-6 rounded-lg shadow-lg w-full max-w-3xl">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Terms and Conditions</h2>
          <button onClick={onClose} className="text-xl font-bold text-red-400 hover:text-red-500">X</button>
        </div>
        <div className="mt-4 space-y-4 max-h-80 overflow-y-auto pr-2">
          <p>
            **Date:** 30 July, 2025
            <br />
            **Company Name:** Justmateng Service Pvt. Ltd
          </p>
          <p>
            By engaging with our delivery services, you ("customer", "you", or "your") agree to the following Terms and Conditions regarding the collection and use of your personal data.
          </p>
          <p>
            <strong>1. Purpose of Data Collection</strong>
            <br />
            We collect and process your personal information for the following purposes:
            <br />
            - To facilitate Cash on Delivery (COD) remittance accurately and securely.
            <br />
            - To ensure proper handling and delivery of your packages.
            <br />
            - To verify the identity and address of the sender and recipient, reducing the risk of fraud.
            <br />
            - To comply with applicable financial and logistical regulations.
          </p>
          <p>
            <strong>2. Data Use and Storage</strong>
            <br />
            - Your data will be used solely for the purposes mentioned above.
            <br />
            - We store your information securely and restrict access to authorized personnel only.
            <br />
            - Bank account details are handled with strict confidentiality and in compliance with applicable data protection regulations.
          </p>
          <p>
            <strong>3. Data Sharing</strong>
            <br />
            We do not sell or share your data with third parties, except:
            <br />
            - When required by law or legal process.
            <br />
            - With banking partners to complete COD remittances.
          </p>
          <p>
            <strong>4. Your Consent</strong>
            <br />
            By using our services, you give explicit consent for us to collect, store, and use your personal and banking information as outlined in this document.
          </p>
          <p>
            <strong>5. Your Rights</strong>
            <br />
            You have the right to:
            <br />
            - Request access to your personal data.
            <br />
            - Ask for corrections or updates.
            <br />
            - Withdraw consent (subject to service limitations).
            <br />
            - Request deletion of your data, unless retention is legally required.
            <br />
            To exercise any of these rights, please contact us at:
            <br />
            Email: justmateng@gmail.com
            <br />
            Phone: 8798009341
          </p>
          <p>
            <strong>6. Data Retention</strong>
            <br />
            We retain your data only as long as necessary to fulfill the purposes described or as required by law.
          </p>
          <p>
            <strong>7. Changes to This Policy</strong>
            <br />
            We may update these terms from time to time. Continued use of our services after changes constitutes acceptance of the updated terms.
          </p>
        </div>

        <div className="flex justify-center mt-6 space-x-4">
          <button 
            onClick={() => {
              window.location.href = '/terms';
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Read Full Terms
          </button>
          <button 
            onClick={handleDownload}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dialog;