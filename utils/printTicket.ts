import { Order } from '../types';
import html2canvas from 'html2canvas';

let lastPrintedOrderId: string | null = null;
let lastPrintTime = 0;

const getTicketHtml = (order: Order, logoUrl: string, date: string) => {
  return `
    <div id="ticket-content" style="
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      margin: 0;
      padding: 10px;
      width: 260px;
      background: white;
      color: black;
      line-height: 1.1;
      display: inline-block;
    ">
      <div style="text-align: center; margin-bottom: 8px; border-bottom: 1px dashed black; padding-bottom: 5px;">
        <img src="${logoUrl}" alt="LOGO" style="max-width: 70px; height: auto; display: block; margin: 0 auto 5px auto; filter: grayscale(100%);" />
        <h2 style="margin: 0; font-size: 14px; font-weight: bold; letter-spacing: -0.5px;">EL BUEN SERVIR</h2>
        <p style="margin: 1px 0;">Comida Casera y Tradicional</p>
        <p style="margin: 1px 0;">Tel: 55-1234-5678</p> 
      </div>
      
      <div style="margin-bottom: 8px; border-bottom: 1px dashed black; padding-bottom: 5px; font-size: 10px;">
        <p style="margin: 1px 0;"><strong>ORDEN:</strong> ${order.id}</p>
        <p style="margin: 1px 0;"><strong>FECHA:</strong> ${date}</p>
        <p style="margin: 1px 0;"><strong>CLIENTE:</strong> ${order.customerName}</p>
        <p style="margin: 1px 0;"><strong>ENTREGA:</strong> ${order.address}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 10px;">
        <thead>
          <tr>
            <th style="width: 15%; text-align: left; border-bottom: 1px solid black;">CANT</th>
            <th style="width: 55%; text-align: left; border-bottom: 1px solid black;">PROD</th>
            <th style="width: 30%; text-align: right; border-bottom: 1px solid black;">$</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td style="padding: 1px 0; vertical-align: top;">${item.quantity}</td>
              <td style="padding: 1px 0; vertical-align: top;">
                ${item.name.toUpperCase()}
                ${item.variationLabel ? `<br><small>(${item.variationLabel})</small>` : ''}
              </td>
              <td style="padding: 1px 0; vertical-align: top; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="text-align: right; margin-top: 5px; font-weight: bold; font-size: 13px; border-top: 1px dashed black; padding-top: 4px;">
        <p style="margin: 0;">TOTAL: $${order.total.toFixed(2)}</p>
      </div>

      <div style="margin-top: 4px; border-top: 1px dashed black; padding-top: 4px; font-size: 10px;">
        <p style="margin: 1px 0;"><strong>PAGO:</strong> ${order.paymentMethod ? order.paymentMethod.toUpperCase() : 'EFECTIVO'}</p>
        ${order.paymentMethod === 'efectivo' && order.cashReceived ? `
          <p style="margin: 1px 0;"><strong>RECIBIDO:</strong> $${order.cashReceived.toFixed(2)}</p>
          <p style="margin: 1px 0;"><strong>CAMBIO:</strong> $${(order.change || 0).toFixed(2)}</p>
        ` : ''}
      </div>

      <div style="text-align: center; margin-top: 10px; border-top: 1px dashed black; padding-top: 8px;">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${order.id}" style="width: 80px; height: 80px; margin: 0 auto 5px auto; display: block;" alt="QR" />
        <p style="margin: 0; font-size: 9px; font-weight: bold;">¡GRACIAS POR TU COMPRA!</p>
        <p style="margin: 1px 0; font-size: 8px;">Mercado Filomeno Mata #67</p>
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

  // 1. GENERATE DOWNLOADABLE IMAGE (Automatic Download)
  const offscreenContainer = document.createElement('div');
  offscreenContainer.style.position = 'absolute';
  offscreenContainer.style.left = '-9999px';
  offscreenContainer.style.top = '0';
  offscreenContainer.style.background = 'white';
  offscreenContainer.innerHTML = getTicketHtml(order, logoUrl, date);
  document.body.appendChild(offscreenContainer);

  try {
    // Wait a bit for images to load (QR code)
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const canvas = await html2canvas(offscreenContainer, {
      scale: 2, // 2 is enough and avoids massive files
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      width: 280, // force width to avoid stretching
    });

    const imgData = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = imgData;
    link.download = `Ticket_${order.id}.png`;
    link.click();
    
    // 2. OPEN PRINT WINDOW
    const printWindow = window.open('', '_blank', `width=300,height=600`);
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Ticket ${order.id}</title>
            <style>
              body { margin: 0; padding: 10px; display: flex; flex-direction: column; align-items: center; background: #f0f0f0; }
              @media print {
                @page { margin: 0; }
                body { margin: 0; padding: 0; background: white; }
                .no-print { display: none; }
              }
              .no-print {
                margin-bottom: 10px;
                background: #ff5722;
                color: #fff;
                border: none;
                padding: 8px 16px;
                border-radius: 8px;
                cursor: pointer;
                font-family: sans-serif;
                font-weight: bold;
                font-size: 12px;
              }
              img { width: 100%; max-width: 280px; height: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
              @media print { img { box-shadow: none; } }
            </style>
          </head>
          <body>
            <button class="no-print" onclick="window.close()">CERRAR VENTANA</button>
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

