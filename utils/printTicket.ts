import { Order } from '../types';

let lastPrintedOrderId: string | null = null;
let lastPrintTime = 0;

export const generateTicket = (order: Order) => {
  const now = Date.now();
  // Prevent duplicate prints of the same order within 2 seconds
  if (lastPrintedOrderId === order.id && (now - lastPrintTime) < 2000) {
    return;
  }
  lastPrintedOrderId = order.id;
  lastPrintTime = now;

  const width = 300;
  // Use a slight timeout to ensure the window is ready
  const printWindow = window.open('', '_blank', `width=${width},height=600`);

  if (!printWindow) {
    alert('Por favor permite las ventanas emergentes para imprimir el ticket');
    return;
  }

  const date = new Date(order.createdAt).toLocaleString('es-MX', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });

  // Use Vite's BASE_URL so the path matches the `base` in vite.config.ts (/elbuenservir/)
  const base = (import.meta as any).env?.BASE_URL || '/';
  const logoUrl = `${window.location.origin}${base}logo.png`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Ticket ${order.id}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39+Text&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          margin: 0;
          padding: 10px;
          width: 100%;
          max-width: 80mm;
          line-height: 1.2;
          color: black;
        }
        .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed black; padding-bottom: 5px; }
        .header img { max-width: 80px; height: auto; display: block; margin: 0 auto 5px auto; filter: grayscale(100%); }
        .header h2 { margin: 0; font-size: 16px; font-weight: bold; }
        .header p { margin: 2px 0; }
        /* Rest of styles */
        .info { margin-bottom: 10px; border-bottom: 1px dashed black; padding-bottom: 5px; }
        .info p { margin: 2px 0; }
        .items { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .items th { text-align: left; border-bottom: 1px solid black; }
        .items td { padding: 2px 0; vertical-align: top; }
        .total { text-align: right; margin-top: 10px; font-weight: bold; font-size: 14px; border-top: 1px dashed black; padding-top: 5px; }
        .barcode-container { text-align: center; margin-top: 20px; padding-top: 10px; border-top: 1px dashed black; }
        .barcode { font-family: 'Libre Barcode 39 Text', cursive; font-size: 42px; margin: 0; }
        .footer { text-align: center; margin-top: 10px; font-size: 10px; }
        .cut-section { margin-top: 40px; border-top: 2px dashed black; padding-top: 20px; text-align: center; }
        .cut-title { font-size: 24px; font-weight: bold; margin: 5px 0; text-transform: uppercase; }
        .cut-subtitle { font-size: 18px; margin: 5px 0; font-weight: bold; text-transform: uppercase; }
        .qr-code { width: 150px; height: 150px; margin: 10px auto; display: block; }
        .paid-stamp {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-25deg);
          border: 4px double #cc0000;
          color: #cc0000;
          font-size: 52px;
          font-weight: bold;
          padding: 10px 20px;
          text-transform: uppercase;
          opacity: 0.5;
          z-index: -1;
          pointer-events: none;
          letter-spacing: 5px;
          border-radius: 10px;
          white-space: nowrap;
        }
        .ticket-container { position: relative; }
        @media print {
          @page { margin: 0; }
          body { padding: 5px; }
        }
      </style>
    </head>
    <body class="ticket-body">
      <div class="ticket-container">
        ${order.paymentStatus === 'paid' ? '<div class="paid-stamp">PAGADO</div>' : ''}
        <div class="header">
        <img id="logo-img" src="${logoUrl}" alt="LOGO" />
        <h2>EL BUEN SERVIR</h2>
        <p>Comida Casera y Tradicional</p>
        <p>Tel: 55-1234-5678</p> 
      </div>
      
      <div class="info">
        <p><strong>Orden:</strong> ${order.id}</p>
        <p><strong>Fecha:</strong> ${date}</p>
        <p><strong>Cliente:</strong> ${order.customerName}</p>
        <p><strong>Entrega:</strong> ${order.address}</p>
        ${order.customerPhone !== 'N/A' ? `<p><strong>Tel:</strong> ${order.customerPhone}</p>` : ''}
      </div>

      <table class="items">
        <thead>
          <tr>
            <th style="width: 10%;">Cant</th>
            <th style="width: 60%;">Prod</th>
            <th style="width: 30%; text-align: right;">$</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td>${item.quantity}</td>
              <td>
                ${item.name}
                ${item.variationLabel ? `<br><small>(${item.variationLabel})</small>` : ''}
              </td>
              <td style="text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="total">
        <p>TOTAL: $${order.total.toFixed(2)}</p>
      </div>

      <div class="info" style="border-top: none; margin-top: 5px;">
        <p><strong>Método de Pago:</strong> ${order.paymentMethod ? order.paymentMethod.toUpperCase() : 'EFECTIVO'}</p>
        ${order.paymentMethod === 'efectivo' && order.cashReceived ? `
          <p><strong>Efectivo Recibido:</strong> $${order.cashReceived.toFixed(2)}</p>
          <p><strong>Cambio:</strong> $${(order.change || 0).toFixed(2)}</p>
        ` : ''}
        ${order.ticketNumber ? `<p><strong>No. Ticket:</strong> ${order.ticketNumber}</p>` : ''}
        ${order.operationNumber ? `<p><strong>Ref/Op:</strong> ${order.operationNumber}</p>` : ''}
      </div>

      <div class="barcode-container">
        <p class="barcode">*${order.id}*</p>
      </div>
      </div>
      
      <div class="footer">
        <p>¡Gracias por su preferencia!</p>
        <p>Visítanos en:</p>
        <p>Av. Principal #123, Col. Centro</p>
        <p>Síguenos en redes sociales:</p>
        <p>El Buen Servir</p>
        <p>Whatsapp: 55-1234-5678</p>
        <p>www.elbuenservir.com</p>
      </div>

      <div class="cut-section">
        <div class="cut-title">ORDEN: ${order.id}</div>
        <div class="cut-subtitle">${order.customerName}</div>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${order.id}" class="qr-code" alt="QR Orden" />
        <p class="barcode" style="font-size: 32px; margin: 5px 0;">*${order.id}*</p>
        <p style="margin-top: 5px; font-size: 10px;">ETIQUETA DE PAQUETE</p>
      </div>
      <script>
        // Guard to prevent double printing
        let printed = false;
        const images = document.querySelectorAll('img');
        let loadedCount = 0;
        const totalImages = images.length;
        
        function doPrint() {
           if (printed) return;
           printed = true;
           setTimeout(() => {
             window.print();
             setTimeout(() => window.close(), 500);
           }, 500);
        }

        function checkPrint() {
           loadedCount++;
           if (loadedCount >= totalImages) {
             doPrint();
           }
        }

        if (totalImages === 0) {
           doPrint();
        } else {
           images.forEach(img => {
             if (img.complete) {
               checkPrint();
             } else {
               img.onload = checkPrint;
               img.onerror = checkPrint;
             }
           });
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

