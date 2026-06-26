/**
 * Simulated Email Notification Service for Gabriel Vintage Archive
 * Logs mock email transmissions to the developer console with styling and structures.
 */

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  type: "outbid" | "purchase_finalized";
}

export const emailNotificationService = {
  sendEmail: (payload: EmailPayload) => {
    const timestamp = new Date().toLocaleString();
    
    // We use distinct, stylized visual cards in console logs to ensure clarity
    console.log(
      `%c 📬 GABRIEL MAILBOX ENGINE: Simulated Email Routed to Server at ${timestamp} `,
      "background: #1C1A17; color: #FAF9F5; border-radius: 4px; padding: 5px 10px; font-weight: bold; font-family: monospace; border-left: 4px solid #AF8B50;"
    );
    console.log(
      `%cTO:      %c${payload.to}\n%cSUBJECT: %c${payload.subject}\n%cCONTENT:\n%c${payload.body}`,
      "color: #877F70; font-family: monospace; font-weight: bold;",
      "color: #1C1A17; font-family: monospace; font-weight: bold; text-decoration: underline;",
      "color: #877F70; font-family: monospace; font-weight: bold;",
      "color: #E61601; font-family: monospace; font-weight: bold;",
      "color: #877F70; font-family: monospace; font-weight: bold;",
      "color: #2E2B25; font-family: Georgia, serif; line-height: 1.5; padding: 10px; background-color: #FCFBF8; border-left: 3px solid #AF8B50; display: block; margin-top: 5px;"
    );
    console.log(
      `%c────────────────────────────────────────────────────────────────────────────────`,
      "color: #AF8B50; font-weight: bold;"
    );
  },

  /**
   * Dispatches outbid email alert log to console
   */
  notifyOutbid: (recipientEmail: string, bidderName: string, itemTitle: string, newBidAmount: number) => {
    const body = `
Dear Gabriel Curator / Valued Collector,

Your bid on our archived lot has been exceeded.

📍 Piece Sourced: "${itemTitle}"
🔥 Elevated Bid Price: ₦${newBidAmount.toLocaleString()}
👤 Bidder Signature Identifier: ${bidderName}

To protect your provenance claim or place a defensive counter-bid, please return to the live showroom cabinets immediately.

Yours in craft,
Gabriel Vintage Archive Automated Intelligence Ledger
    `.trim();

    emailNotificationService.sendEmail({
      to: recipientEmail,
      subject: `⚠️ Live Outbid Notice: "${itemTitle}" on Gabriel Vintage`,
      body,
      type: "outbid"
    });
  },

  /**
   * Dispatches finalized purchase order receipt to console
   */
  notifyPurchaseFinalized: (recipientEmail: string, buyerName: string, itemTitle: string, price: number, transactionId: string) => {
    const body = `
Dear ${buyerName},

Archived Acquisition Accomplished!

We are pleased to confirm that this highly coveted item has been successfully finalized in our active order book and secured inside your personal virtual closet.

📦 Sourced Vault Item: "${itemTitle}"
💵 Handled Price Amount: ₦${price.toLocaleString()}
🧾 Ledger Txn ID: ${transactionId}
🚚 Delivery Status: Preparing Wax-Sealed Courier Packaging

Our boutique flat-checks all dimensions and bundles its historic flea market backstory before final courier dispatch. Thank you for protecting the craft and avoiding fast-fashion catalogs.

Best regards,
Gabriel Vintage Ltd.
    `.trim();

    emailNotificationService.sendEmail({
      to: recipientEmail,
      subject: `🎉 Transaction Completed: Sourced Heritage Secured for "${itemTitle}"`,
      body,
      type: "purchase_finalized"
    });
  }
};
