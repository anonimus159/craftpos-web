import { Sale, AppConfig, CompanyConfig } from '@/types/types';

export function generateTicketHtml(sale: Sale, appConfig: AppConfig, companyConfig: CompanyConfig): string {
  // Config defaults
  const currency = appConfig.currencySymbol || '$';
  const width = appConfig.printFormat === '58mm' ? '58mm' : '80mm'; // default 80mm
  const is58 = width === '58mm';
  
  const fontSizeSmall = is58 ? '10px' : '12px';
  const fontSizeNormal = is58 ? '12px' : '14px';
  const fontSizeTitle = is58 ? '16px' : '20px';

  // Date formatting
  const dateObj = new Date(sale.timestamp);
  const formattedDate = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

  let itemsHtml = '';
  
  if (sale.items && sale.items.length > 0) {
    itemsHtml = sale.items.map(item => {
      const name = item.product.name.substring(0, is58 ? 20 : 30);
      const total = (item.product.salePrice * item.quantity).toFixed(2);
      return `
        <tr>
          <td style="text-align: left; padding: 2px 0;">\${item.quantity}x \${name}</td>
          <td style="text-align: right; padding: 2px 0;">\${currency} \${total}</td>
        </tr>
      `;
    }).join('');
  }

  const logoHtml = appConfig.logoBase64 
    ? `<img src="\${appConfig.logoBase64}" style="max-width: 150px; margin-bottom: 10px;" />` 
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Ticket \${sale.ticketNumber}</title>
      <style>
        @page { margin: 0; size: auto; }
        body {
          font-family: 'Courier New', Courier, monospace;
          margin: 0;
          padding: 10px;
          width: \${width};
          color: #000;
          font-size: \${fontSizeNormal};
          line-height: 1.2;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .divider { border-top: 1px dashed #000; margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; }
      </style>
    </head>
    <body>
      <div class="text-center">
        \${logoHtml}
        <div class="font-bold" style="font-size: \${fontSizeTitle}; margin-bottom: 5px;">\${appConfig.companyName || 'CRAFT POS'}</div>
        <div style="font-size: \${fontSizeSmall}">\${appConfig.taxIdType || 'NIT'}: \${appConfig.taxId || '000000'}</div>
        <div style="font-size: \${fontSizeSmall}">\${appConfig.address || ''}</div>
        <div style="font-size: \${fontSizeSmall}">Tel: \${appConfig.phone || ''}</div>
      </div>
      
      <div class="divider"></div>
      
      <div>
        <div>Ticket: \${sale.ticketNumber}</div>
        <div>Fecha: \${formattedDate}</div>
        <div>Cajero: \${sale.cashier || appConfig.cashierName || 'Caja 1'}</div>
        <div>Cliente: \${sale.clientId && sale.clientId !== 'c-gen' ? sale.clientId : 'Consumidor Final'}</div>
      </div>
      
      <div class="divider"></div>
      
      <table>
        <thead>
          <tr>
            <th style="text-align: left; padding-bottom: 5px;">Cant.  Producto</th>
            <th style="text-align: right; padding-bottom: 5px;">Total</th>
          </tr>
        </thead>
        <tbody>
          \${itemsHtml}
        </tbody>
      </table>
      
      <div class="divider"></div>
      
      <table>
        <tr>
          <td class="font-bold" style="font-size: \${fontSizeTitle}; padding-top: 5px;">TOTAL</td>
          <td class="text-right font-bold" style="font-size: \${fontSizeTitle}; padding-top: 5px;">\${currency} \${sale.total.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding-top: 5px;">Recibido (\${sale.paymentMethod})</td>
          <td class="text-right" style="padding-top: 5px;">\${currency} \${(sale.cashReceived || sale.total).toFixed(2)}</td>
        </tr>
        <tr>
          <td>Cambio</td>
          <td class="text-right">\${currency} \${((sale.cashReceived || sale.total) - sale.total).toFixed(2)}</td>
        </tr>
      </table>
      
      <div class="divider" style="margin-top: 15px;"></div>
      
      <div class="text-center" style="margin-top: 10px; font-size: \${fontSizeSmall}">
        <div>¡Gracias por su compra!</div>
        <div style="margin-top: 5px;">\${appConfig.tagLine || 'Sistema POS proporcionado por CraftPOS'}</div>
      </div>
    </body>
    </html>
  `;
}
