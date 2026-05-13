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
      padding: 15px;
      width: 280px;
      background: white;
      color: black;
      line-height: 1.2;
    ">
      <div style="text-align: center; margin-bottom: 10px; border-bottom: 1px dashed black; padding-bottom: 5px;">
        <img src="${logoUrl}" alt="LOGO" style="max-width: 80px; height: auto; display: block; margin: 0 auto 5px auto; filter: grayscale(100%);" />
        <h2 style="margin: 0; font-size: 16px; font-weight: bold;">EL BUEN SERVIR</h2>
        <p style="margin: 2px 0;">Comida Casera y Tradicional</p>
        <p style="margin: 2px 0;">Tel: 55-1234-5678</p> 
      </div>
      
      <div style="margin-bottom: 10px; border-bottom: 1px dashed black; padding-bottom: 5px;">
        <p style="margin: 2px 0;"><strong>Orden:</strong> ${order.id}</p>
        <p style="margin: 2px 0;"><strong>Fecha:</strong> ${date}</p>
        <p style="margin: 2px 0;"><strong>Cliente:</strong> ${order.customerName}</p>
        <p style="margin: 2px 0;"><strong>Entrega:</strong> ${order.address}</p>
        ${order.customerPhone !== 'N/A' ? `<p style="margin: 2px 0;"><strong>Tel:</strong> ${order.customerPhone}</p>` : ''}
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
        <thead>
          <tr>
            <th style="width: 15%; text-align: left; border-bottom: 1px solid black;">Cant</th>
            <th style="width: 55%; text-align: left; border-bottom: 1px solid black;">Prod</th>
            <th style="width: 30%; text-align: right; border-bottom: 1px solid black;">$</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td style="padding: 2px 0; vertical-align: top;">${item.quantity}</td>
              <td style="padding: 2px 0; vertical-align: top;">
                ${item.name}
                ${item.variationLabel ? `<br><small>(${item.variationLabel})</small>` : ''}
              </td>
              <td style="padding: 2px 0; vertical-align: top; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="text-align: right; margin-top: 10px; font-weight: bold; font-size: 14px; border-top: 1px dashed black; padding-top: 5px;">
        <p style="margin: 0;">TOTAL: $${order.total.toFixed(2)}</p>
      </div>

      <div style="margin-top: 5px; border-top: 1px dashed black; padding-top: 5px;">
        <p style="margin: 2px 0;"><strong>Método de Pago:</strong> ${order.paymentMethod ? order.paymentMethod.toUpperCase() : 'EFECTIVO'}</p>
        ${order.paymentMethod === 'efectivo' && order.cashReceived ? `
          <p style="margin: 2px 0;"><strong>Efectivo Recibido:</strong> $${order.cashReceived.toFixed(2)}</p>
          <p style="margin: 2px 0;"><strong>Cambio:</strong> $${(order.change || 0).toFixed(2)}</p>
        ` : ''}
        ${order.ticketNumber ? `<p style="margin: 2px 0;"><strong>No. Ticket:</strong> ${order.ticketNumber}</p>` : ''}
        ${order.operationNumber ? `<p style="margin: 2px 0;"><strong>Ref/Op:</strong> ${order.operationNumber}</p>` : ''}
      </div>

      <div style="text-align: center; margin-top: 15px; border-top: 1px dashed black; padding-top: 10px;">
        <p style="margin: 0; font-size: 10px;">¡Gracias por su preferencia!</p>
        <p style="margin: 2px 0; font-size: 9px;">Visítanos en: Mercado Filomeno Mata #67</p>
        <p style="margin: 2px 0; font-size: 9px;">Teziutlán, Puebla</p>
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
  offscreenContainer.innerHTML = getTicketHtml(order, logoUrl, date);
  document.body.appendChild(offscreenContainer);

  try {
    // Wait a bit for images to potentially load
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const canvas = await html2canvas(offscreenContainer, {
      scale: 3, // High quality for printing if they use the image
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = imgData;
    link.download = `Ticket_${order.id}_${order.customerName.replace(/\s+/g, '_')}.png`;
    link.click();
    
    // 2. OPEN PRINT WINDOW (As fallback)
    const printWindow = window.open('', '_blank', `width=350,height=600`);
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Ticket ${order.id}</title>
            <style>
              body { margin: 0; padding: 0; display: flex; justify-content: center; }
              @media print {
                @page { margin: 0; }
                body { margin: 0; }
                .no-print { display: none; }
              }
              .no-print {
                position: fixed;
                top: 10px;
                right: 10px;
                background: #000;
                color: #fff;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-family: sans-serif;
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            <button class="no-print" onclick="window.close()">CERRAR</button>
            <img src="${imgData}" style="width: 100%; max-width: 300px;" />
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  // Don't close automatically so user can see it if print fails
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
    alert('Hubo un problema al generar la imagen del ticket. Se intentará abrir la ventana de impresión normal.');
  } finally {
    document.body.removeChild(offscreenContainer);
  }
};

