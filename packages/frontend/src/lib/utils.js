import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function exportCSV(filename, rows) {
  if (!rows || !rows.length) return
  const headers = Object.keys(rows[0])
  const csvContent = [
    headers.join(","),
    ...rows.map(row => headers.map(h => {
      let cell = row[h] === null || row[h] === undefined ? "" : String(row[h])
      if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
        cell = `"${cell.replace(/"/g, '""')}"`
      }
      return cell
    }).join(","))
  ].join("\n")

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportPDF(filename, title, columns, formattedData) {
  if (!formattedData || !formattedData.length) return;
  const doc = new jsPDF('landscape');
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
  
  autoTable(doc, {
    startY: 28,
    head: [columns],
    body: formattedData.map(row => columns.map(col => row[col])),
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [79, 70, 229] } // Indigo-600 to match theme
  });
  doc.save(`${filename}.pdf`);
}

export function printPO(po) {
  if (!po) return;
  try {
    const doc = new jsPDF('portrait');
    const items = po.items || [];
    
    doc.setFontSize(22);
    doc.text('PURCHASE ORDER', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`PO Number: ${po.invoice_number || 'N/A'}`, 14, 30);
    doc.text(`Date: ${po.invoice_date ? new Date(po.invoice_date).toLocaleDateString() : 'N/A'}`, 14, 35);
    doc.text(`Supplier: ${po.supplier_name || 'N/A'}`, 14, 40);
    doc.text(`Status: ${po.status?.toUpperCase() || 'N/A'}`, 14, 45);

    const columns = ["Tool", "SKU", "Location", "Qty", "Unit Cost", "Total"];
    const rows = items.map(item => [
      item.tool_name || 'Unknown Tool',
      item.sku || 'N/A',
      item.location_name || 'N/A',
      item.quantity ?? item.qty_ordered ?? 0,
      `AED ${Number(item.unit_price ?? item.unitPrice ?? item.unit_cost ?? 0).toFixed(2)}`,
      `AED ${(Number(item.unit_price ?? item.unitPrice ?? item.unit_cost ?? 0) * Number(item.quantity ?? item.qty_ordered ?? 0)).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 55,
      head: [columns],
      body: rows,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [51, 65, 85] }
    });

    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 65;
    doc.setFont('helvetica', 'normal');
    doc.text(`Tax: AED ${Number(po.tax_amount || 0).toFixed(2)}`, 140, finalY);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: AED ${Number(po.total_amount || 0).toFixed(2)}`, 140, finalY + 7);

    if (po.notes) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Notes: ${po.notes}`, 14, finalY + 20);
    }

    doc.autoPrint();
    const blobURL = URL.createObjectURL(doc.output('blob'));
    const printWindow = window.open(blobURL, '_blank');
    if (!printWindow) {
      // Fallback if popup blocker is active
      const link = document.createElement('a');
      link.href = blobURL;
      link.download = `PO-${po.invoice_number || 'Draft'}.pdf`;
      link.click();
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Could not generate PDF for printing.");
  }
}
