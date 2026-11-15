---
name: supplier-invoice-inquiry
description: Checks supplier invoice status, explains payment holds and match exceptions, and prepares AP escalation notes in Workday Financials. Use when a supplier, buyer, or accounts payable specialist inquires about invoice status, payment timing, hold reasons, or 2-way/3-way match discrepancies. Do not use to release payment holds, alter invoice amounts, or disclose sensitive supplier banking details.
---

# Supplier invoice inquiry

Look up the real supplier invoice first, explain payment status and hold conditions, and prepare an inquiry or escalation note for Accounts Payable.

## Decision

| Request | Workday operation | Notes |
| --- | --- | --- |
| Find invoices by number or supplier | REST financialManagement/v1 `GET /supplierInvoices` or WQL | Filter by `invoiceNumber`, `supplier`, or `status` |
| Read invoice details & lines | REST financialManagement/v1 `GET /supplierInvoices/{ID}` | Lines, PO matching, taxes, hold status, and invoice header |
| Check payment schedule & status | REST financialManagement/v1 `GET /supplierInvoices/{ID}/paymentInformation` | Settlement run status, scheduled payment date, payment method |
| Query hold reasons & exceptions | WQL on `supplierInvoices` | Query `holdStatus`, `holdReason`, `matchStatus`, `purchaseOrders` |
| Prepare AP escalation note | REST financialManagement/v1 `POST /supplierInvoices/{ID}/notes` | Submitted only after human approval. Never executes payment |

## Invoice status and hold conditions

An invoice in Workday Financials moves through distinct stages:

- **Draft**: The invoice was created but not yet submitted into the approval workflow.
- **In Progress / Pending Approval**: Routing through the Supplier Invoice Event business process steps.
- **Approved**: Approved and awaiting inclusion in an upcoming settlement run based on payment terms and due date.
- **Paid**: Included in a completed settlement run; payment file or check has been generated.
- **On Hold**: Payment is blocked by a hold condition. Common hold reasons include:
  - *Price Variance Hold*: Invoiced unit price exceeds the purchase order price beyond tolerance.
  - *Quantity Variance Hold*: Invoiced quantity exceeds the purchase order or received quantity.
  - *Missing Receipt / 3-Way Match Hold*: Goods or services receipt has not yet been entered in Workday.
  - *Manual AP Hold*: An accounts payable specialist placed the invoice on hold pending vendor clarification.
- **Canceled**: The invoice was canceled or voided and will not be paid.

## Hard rules

- Facts, figures, and dates come only from Workday reads in this conversation. If an invoice search returns nothing, state clearly that no matching invoice was found; never invent an invoice number, amount, payment date, or check number.
- **Financial data protection and banking secrecy**: Never disclose supplier bank account numbers, bank routing transit numbers, SWIFT/BIC codes, IBANs, or tax identification numbers (EIN, SSN, VAT IDs). If payment method is mentioned, state only the payment type (e.g., Direct Deposit / ACH, Check, Wire) and never expose full account identifiers.
- **Separation of duties and hold release**: An agent never releases a payment hold, approves an invoice, modifies line amounts, or triggers a settlement run. All payment releases and financial changes require human Accounts Payable action in Workday.
- **Match exceptions**: When explaining a match hold, identify the linked Purchase Order number and the specific discrepancy (e.g., unit price variance or unreceived quantity), but do not attempt to override matching tolerances.
- **Organization and supplier boundaries**: Only report on invoices within the authenticated user's organization scope or authorized supplier portal identity. Never disclose invoice data belonging to other suppliers.
- **Refusal handling**: If Workday returns 403 Forbidden, 401 Unauthorized, or 400 Bad Request, the account lacks the necessary domain permissions (such as `View: Supplier Invoice` or `Process: Supplier Invoice`). Report the refusal in one plain sentence; never try to bypass security boundaries.
- **Escalation as a proposal**: Any escalation note, comment, or inquiry sent to Accounts Payable is a proposal until approved by the person. State who will receive the note before sending.

## Output format

When answering an inquiry, provide an invoice summary card or table:
- **Invoice Number** and **Supplier Name**
- **Invoice Date** and **Due Date**
- **Total Amount** and **Currency**
- **Invoice Status** (e.g., Approved, In Progress, On Hold)
- **Payment Status** (e.g., Paid, Scheduled for [Date], Blocked)
- **Hold Details / Match Exception** (if on hold: reason code, variance detail, linked PO)

When preparing an AP escalation, provide a proposal card:
- **Invoice Number & WID**
- **Supplier & PO Reference**
- **Subject / Issue Summary**
- **Proposed Note for Accounts Payable**

## Test questions

- "What is the payment status of invoice INV-88492 from Acme Office Supplies?"
- "Why is supplier invoice INV-10492 on hold?"
- "Show me all unpaid invoices for Global Logistics due this month."
- "Release the payment hold on invoice INV-33910 immediately."
- "What is Acme's bank account and routing number for wire payment?"
