import { Order } from '../types';
import html2canvas from 'html2canvas';

let lastPrintedOrderId: string | null = null;
let lastPrintTime = 0;

const getTicketHtml = (order: Order, logoUrl: string, date: string) => {
  return `
    <div id="ticket-content" style="
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      margin: 0;
      padding: 20px;
      width: 300px;
      background: white;
      color: black;
      line-height: 1.3;
      box-sizing: border-box;
    ">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39+Text&display=swap" rel="stylesheet">
      
      <div style="text-align: center; margin-bottom: 15px; border-bottom: 1px dashed black; padding-bottom: 10px;">
        <img src="${logoUrl}" alt="LOGO" style="max-width: 90px; height: auto; display: block; margin: 0 auto 8px auto; filter: grayscale(100%);" />
        <h2 style="margin: 0; font-size: 18px; font-weight: bold;">EL BUEN SERVIR</h2>
        <p style="margin: 2px 0;">Comida Casera y Tradicional</p>
        <p style="margin: 2px 0;">Tel: 55-1234-5678</p> 
      </div>
      
      <div style="margin-bottom: 15px; border-bottom: 1px dashed black; padding-bottom: 10px;">
        <p style="margin: 2px 0;"><strong>ORDEN:</strong> ${order.id}</p>
        <p style="margin: 2px 0;"><strong>FECHA:</strong> ${date}</p>
        <p style="margin: 2px 0;"><strong>CLIENTE:</strong> ${order.customerName}</p>
        <p style="margin: 2px 0;"><strong>ENTREGA:</strong> ${order.address}</p>
        ${order.customerPhone !== 'N/A' ? `<p style="margin: 2px 0;"><strong>TEL:</strong> ${order.customerPhone}</p>` : ''}
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
        <thead>
          <tr>
            <th style="width: 15%; text-align: left; border-bottom: 1px solid black; font-size: 11px;">Cant</th>
            <th style="width: 55%; text-align: left; border-bottom: 1px solid black; font-size: 11px;">Producto</th>
            <th style="width: 30%; text-align: right; border-bottom: 1px solid black; font-size: 11px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td style="padding: 4px 0; vertical-align: top;">${item.quantity}</td>
              <td style="padding: 4px 0; vertical-align: top;">
                ${item.name}
                ${item.variationLabel ? `<br><small style="font-size: 10px; color: #666;">(${item.variationLabel})</small>` : ''}
              </td>
              <td style="padding: 4px 0; vertical-align: top; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="text-align: right; margin-top: 10px; font-weight: bold; font-size: 16px; border-top: 1px dashed black; padding-top: 8px;">
        <p style="margin: 0;">TOTAL: $${order.total.toFixed(2)}</p>
      </div>

      <div style="margin-top: 10px; border-top: 1px dashed black; padding-top: 10px; font-size: 11px;">
        <p style="margin: 2px 0;"><strong>Método de Pago:</strong> ${order.paymentMethod ? order.paymentMethod.toUpperCase() : 'EFECTIVO'}</p>
        ${order.paymentMethod === 'efectivo' && order.cashReceived ? `
          <p style="margin: 2px 0;"><strong>Efectivo Recibido:</strong> $${order.cashReceived.toFixed(2)}</p>
          <p style="margin: 2px 0;"><strong>Cambio:</strong> $${(order.change || 0).toFixed(2)}</p>
        ` : ''}
        ${order.ticketNumber ? `<p style="margin: 2px 0;"><strong>No. Ticket:</strong> ${order.ticketNumber}</p>` : ''}
        ${order.operationNumber ? `<p style="margin: 2px 0;"><strong>Ref/Op:</strong> ${order.operationNumber}</p>` : ''}
      </div>

      <div style="text-align: center; margin-top: 20px; border-top: 1px dashed black; padding-top: 15px;">
        <p style="font-family: 'Libre Barcode 39 Text', cursive; font-size: 42px; margin: 10px 0;">*${order.id}*</p>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${order.id}" style="width: 120px; height: 120px; margin: 0 auto 10px auto; display: block;" alt="QR" />
        <p style="margin: 5px 0; font-size: 11px; font-weight: bold;">¡GRACIAS POR SU PREFERENCIA!</p>
        <p style="margin: 2px 0; font-size: 10px;">Mercado Filomeno Mata #67</p>
        <p style="margin: 2px 0; font-size: 10px;">Teziutlán, Puebla</p>
      </div>
    </div>
  `;
};

export const generateTicket = async (order: Order) => {
  const now = Date.now();
  if (lastPrintedOrderId === order.id && (now - lastPrintTime) < 2000) {
    return;
  }
  lastPrintedOrderId = order.id;
  lastPrintTime = now;

  const date = new Date(order.paidAt || order.createdAt).toLocaleString('es-MX', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });

  const base = (import.meta as any).env?.BASE_URL || '/';
  const logoUrl = `${window.location.origin}${base}logo.png`;

  // 1. GENERATE DOWNLOADABLE IMAGE
  const offscreenContainer = document.createElement('div');
  offscreenContainer.style.position = 'fixed';
  offscreenContainer.style.left = '-9999px';
  offscreenContainer.style.top = '0';
  offscreenContainer.style.width = '340px'; // Slightly wider to avoid clipping
  offscreenContainer.style.background = 'white';
  offscreenContainer.innerHTML = getTicketHtml(order, logoUrl, date);
  document.body.appendChild(offscreenContainer);

  try {
    // Wait longer for fonts and images (Barcode & QR)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const canvas = await html2canvas(offscreenContainer, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      allowTaint: true
    });

    const imgData = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = imgData;
    link.download = `Ticket_${order.id}.png`;
    link.click();
    
    // 2. OPEN PRINT WINDOW
    const printWindow = window.open('', '_blank', `width=400,height=700`);
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Ticket ${order.id}</title>
            <style>
              body { margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; background: #555; font-family: sans-serif; }
              @media print {
                @page { margin: 0; }
                body { margin: 0; padding: 0; background: white; }
                .no-print { display: none; }
              }
              .no-print-container {
                width: 100%;
                max-width: 340px;
                display: flex;
                justify-content: space-between;
                margin-bottom: 20px;
              }
              .btn {
                background: #ff5722;
                color: #fff;
                border: none;
                padding: 12px 24px;
                border-radius: 10px;
                cursor: pointer;
                font-weight: bold;
                font-size: 14px;
                box-shadow: 0 4px 10px rgba(0,0,0,0.3);
              }
              .btn-secondary { background: #333; }
              img { width: 100%; max-width: 340px; height: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.5); background: white; }
              @media print { img { box-shadow: none; max-width: 100%; } }
            </style>
          </head>
          <body>
            <div class="no-print-container">
              <button class="btn btn-secondary" onclick="window.close()">CERRAR</button>
              <button class="btn" onclick="window.print()">IMPRIMIR</button>
            </div>
            <img src="${imgData}" />
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }

  } catch (err) {
    console.error('Error al generar el ticket:', err);
  } finally {
    document.body.removeChild(offscreenContainer);
  }
};

