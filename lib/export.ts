import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, formatTime } from '@/lib/utils';

export interface AttendanceRecord {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workHours: number | null;
  status: string;
  note: string | null;
  user: {
    name: string;
    designation: string | null;
  };
}

export interface SalaryRecord {
  userId: string;
  month: string;
  amount: number;
  status: string;
  paidAt: string | null;
  note: string | null;
  user: {
    name: string;
    designation: string | null;
  };
}

export function exportAttendanceCSV(records: AttendanceRecord[], filename = 'attendance-report') {
  const data = records.map((r) => ({
    'Employee': r.user.name,
    'Designation': r.user.designation || 'Team Member',
    'Date': formatDate(r.date, 'dd MMM yyyy'),
    'Check In': r.checkIn ? formatTime(r.checkIn) : '—',
    'Check Out': r.checkOut ? formatTime(r.checkOut) : '—',
    'Hours Worked': r.workHours != null ? `${r.workHours}h` : '—',
    'Status': r.status,
    'Note': r.note || '—'
  }));

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportSalaryCSV(records: SalaryRecord[], filename = 'salary-payroll') {
  const data = records.map((r) => ({
    'Employee': r.user.name,
    'Designation': r.user.designation || 'Team Member',
    'Month': r.month,
    'Amount (₹)': r.amount,
    'Status': r.status,
    'Paid At': r.paidAt ? formatDate(r.paidAt, 'dd MMM yyyy') : '—',
    'Note': r.note || '—'
  }));

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportSalaryPDF(records: SalaryRecord[], employeeName: string, month: string) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text('WebWynk — Salary Report', 14, 22);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Employee Name: ${employeeName}`, 14, 30);
  doc.text(`Report Period: ${month}`, 14, 36);

  // Table
  autoTable(doc, {
    startY: 42,
    head: [['Employee', 'Month', 'Amount (₹)', 'Status', 'Paid On', 'Note']],
    body: records.map(r => [
      r.user.name,
      r.month,
      `Rs. ${r.amount.toLocaleString('en-IN')}`,
      r.status,
      r.paidAt ? formatDate(r.paidAt, 'dd MMM yyyy') : '—',
      r.note || '—',
    ]),
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] }, // Indigo-500
    styles: { fontSize: 9, cellPadding: 3 },
  });

  doc.save(`salary-${employeeName.replace(/\s+/g, '-').toLowerCase()}-${month}.pdf`);
}

export function exportSalarySlipPDF(record: SalaryRecord) {
  const doc = new jsPDF();
  const amount = record.amount;

  const basic = Math.round(amount * 0.50);
  const hra = Math.round(amount * 0.25);
  const specialAllowance = Math.round(amount * 0.25);
  const gross = basic + hra + specialAllowance;

  const pf = Math.round(basic * 0.12);
  const tds = Math.round(amount * 0.05);
  const pt = 200;
  const deductions = pf + tds + pt;
  const netPay = gross - deductions;

  // Title & Header
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 185, 129); // Emerald-500
  doc.text("WebWynk CRM", 14, 25);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Digital Marketing & Software Agency", 14, 30);
  doc.text("Salary Slip (Payslip)", 14, 35);
  
  // Horizontal divider
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 40, 196, 40);

  // Employee details section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("Employee Information", 14, 50);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  // Left column
  doc.text(`Employee Name: ${record.user.name}`, 14, 58);
  doc.text(`Designation: ${record.user.designation || 'Team Member'}`, 14, 64);
  doc.text(`Employee ID: ${record.userId.substring(0, 8)}`, 14, 70);

  // Right column
  const [year, month] = record.month.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  doc.text(`Payslip Period: ${monthName}`, 120, 58);
  doc.text(`Payment Status: ${record.status}`, 120, 64);
  doc.text(`Paid Date: ${record.paidAt ? formatDate(record.paidAt, 'dd MMM yyyy') : '—'}`, 120, 70);

  // Earnings & Deductions table layout
  autoTable(doc, {
    startY: 80,
    head: [['Earnings Description', 'Amount', 'Deductions Description', 'Amount']],
    body: [
      ['Basic Salary', `Rs. ${basic.toLocaleString('en-IN')}`, 'Provident Fund (PF)', `Rs. ${pf.toLocaleString('en-IN')}`],
      ['House Rent Allowance (HRA)', `Rs. ${hra.toLocaleString('en-IN')}`, 'Tax Deducted at Source (TDS)', `Rs. ${tds.toLocaleString('en-IN')}`],
      ['Special Allowance', `Rs. ${specialAllowance.toLocaleString('en-IN')}`, 'Professional Tax (PT)', `Rs. ${pt.toLocaleString('en-IN')}`],
      ['', '', '', ''],
      ['Gross Earnings', `Rs. ${gross.toLocaleString('en-IN')}`, 'Total Deductions', `Rs. ${deductions.toLocaleString('en-IN')}`]
    ],
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129] }, // Emerald-500
    styles: { fontSize: 9, cellPadding: 4 },
  });

  // Net Pay summary banner at bottom
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  
  doc.setFillColor(240, 253, 244); // light green bg
  doc.rect(14, finalY, 182, 16, "F");
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(21, 128, 61); // dark green
  doc.text(`NET PAYABLE AMOUNT: Rs. ${netPay.toLocaleString('en-IN')}`, 18, finalY + 10);

  // Note
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(148, 163, 184);
  doc.text("Note: This is a computer-generated salary slip and does not require a physical signature.", 14, finalY + 25);

  doc.save(`payslip-${record.user.name.replace(/\s+/g, '-').toLowerCase()}-${record.month}.pdf`);
}
