import { jsPDF } from 'jspdf';

export function generateRentalAgreementPDF(booking) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = 20;

  const line = () => {
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageW - margin, y);
    y += 6;
  };

  const text = (str, x, size = 11, style = 'normal', color = [30, 30, 30]) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    doc.setTextColor(...color);
    doc.text(str, x, y);
  };

  const row = (label, value) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(label, margin, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(String(value || '—'), margin + 65, y);
    y += 7;
  };

  // Header bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageW, 38, 'F');
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11); // amber-500
  doc.text('LongStay', margin, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 200);
  doc.text('Long-Term Rental Agreement', margin, 28);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageW - margin - 60, 28);

  y = 50;

  // Agreement ID
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text(`Agreement ID: ${booking.id}`, margin, y);
  y += 10;

  // Section: Property
  text('1. PROPERTY DETAILS', margin, 13, 'bold', [15, 23, 42]);
  y += 8;
  line();
  row('Property Name:', booking.property_title);
  row('Property ID:', booking.property_id);
  row('Category:', booking.category || 'Residential');
  y += 4;

  // Section: Parties
  text('2. PARTIES', margin, 13, 'bold', [15, 23, 42]);
  y += 8;
  line();
  row('Host (Landlord):', booking.host_name);
  row('Renter (Tenant):', booking.renter_name);
  row('Renter Email:', booking.renter_email || '—');
  y += 4;

  // Section: Lease Terms
  text('3. LEASE TERMS', margin, 13, 'bold', [15, 23, 42]);
  y += 8;
  line();
  row('Start Date:', booking.start_date);
  row('End Date:', booking.end_date);
  row('Lease Duration:', `${booking.lease_months} month(s)`);
  row('Monthly Rent:', `${booking.currency || 'USD'} ${Number(booking.monthly_rent || 0).toLocaleString()}`);
  row('Total Amount:', `${booking.currency || 'USD'} ${Number(booking.total_amount || 0).toLocaleString()}`);
  row('Security Deposit:', `${booking.currency || 'USD'} ${Number(booking.security_deposit || 0).toLocaleString()}`);
  y += 4;

  // Section: Terms & Conditions
  text('4. TERMS & CONDITIONS', margin, 13, 'bold', [15, 23, 42]);
  y += 8;
  line();

  const clauses = [
    '1. The Renter agrees to pay the monthly rent on or before the 1st of each month.',
    '2. The security deposit is refundable within 30 days after lease end, subject to property inspection.',
    '3. The Renter shall not sublet the property without prior written consent from the Host.',
    '4. The property must be maintained in good condition. Any damage beyond normal wear and tear is the Renter\'s responsibility.',
    '5. Either party may terminate this agreement with 30 days written notice, subject to local regulations.',
    '6. The Host reserves the right to inspect the property with 24 hours prior notice.',
    '7. Utilities and additional services are the responsibility of the Renter unless otherwise agreed.',
    '8. This agreement is governed by applicable local tenancy laws.',
  ];

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  clauses.forEach(clause => {
    const lines = doc.splitTextToSize(clause, contentW);
    doc.text(lines, margin, y);
    y += lines.length * 5.5 + 2;
  });

  y += 6;

  // Signatures
  text('5. SIGNATURES', margin, 13, 'bold', [15, 23, 42]);
  y += 8;
  line();

  const sigY = y + 20;
  // Host signature block
  doc.setDrawColor(150, 150, 150);
  doc.line(margin, sigY, margin + 70, sigY);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Host Signature', margin, sigY + 5);
  doc.text(booking.host_name || '', margin, sigY + 11);

  // Renter signature block
  const renterSigX = pageW - margin - 70;
  doc.line(renterSigX, sigY, renterSigX + 70, sigY);
  doc.text('Renter Signature', renterSigX, sigY + 5);
  doc.text(booking.renter_name || '', renterSigX, sigY + 11);

  y = sigY + 20;

  // Date line
  doc.setFontSize(9);
  doc.setTextColor(130, 130, 130);
  doc.text(`Date: ___________________`, margin, y);
  doc.text(`Date: ___________________`, renterSigX, y);

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setFillColor(245, 245, 245);
  doc.rect(0, footerY - 6, pageW, 18, 'F');
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('This document was generated by LongStay. It is for informational purposes. Please consult a legal professional for binding agreements.', margin, footerY);

  const filename = `rental-agreement-${booking.id?.slice(0, 8) || 'draft'}.pdf`;
  doc.save(filename);
}