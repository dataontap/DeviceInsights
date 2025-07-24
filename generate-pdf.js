import fs from 'fs';
import path from 'path';
import htmlPdf from 'html-pdf-node';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generatePDF() {
  try {
    // Read the HTML file
    const htmlFilePath = path.join(__dirname, 'OXIO_Device_Compatibility_Policy.html');
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
    
    // PDF generation options
    const options = {
      format: 'A4',
      width: '8.5in',
      height: '11in',
      border: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
      printBackground: true,
      displayHeaderFooter: false,
      margin: {
        top: '0.5in',
        bottom: '0.5in',
        left: '0.5in',
        right: '0.5in'
      }
    };
    
    // File object for html-pdf-node
    const file = { content: htmlContent };
    
    console.log('Generating PDF...');
    
    // Generate PDF
    const pdfBuffer = await htmlPdf.generatePdf(file, options);
    
    // Save PDF to file
    const outputPath = path.join(__dirname, 'OXIO_Device_Compatibility_Policy.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    
    console.log(`PDF generated successfully: ${outputPath}`);
    console.log(`File size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    process.exit(1);
  }
}

// Run the PDF generation
generatePDF();