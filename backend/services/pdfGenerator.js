const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerator {
  async generateSampleReport(report) {
    return new Promise((resolve, reject) => {
      try {
        // CRITICAL FIX: The function receives a 'report' object, not a 'sample' object
        // Extract the sample from the report
        const sample = report.sample || report.samples || {};
        
        // Handle case where report might not have sample data
        if (!sample || Object.keys(sample).length === 0) {
          reject(new Error('Report does not contain sample data'));
          return;
        }

        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          bufferPages: true
        });

        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          let pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Header
        doc
          .fontSize(24)
          .fillColor('#2c3e50')
          .text('Sample Analysis Report', { align: 'center' })
          .moveDown();

        // Report title (if available)
        if (report.title) {
          doc
            .fontSize(16)
            .fillColor('#34495e')
            .text(report.title, { align: 'center' })
            .moveDown();
        }

        // Add logo or QR code if available
        if (sample.qr_code_data) {
          const qrPath = path.join(__dirname, '..', sample.qr_code_data);
          if (fs.existsSync(qrPath)) {
            try {
              doc.image(qrPath, doc.page.width - 150, 50, { width: 100 });
            } catch (err) {
              console.error('Failed to add QR code to PDF:', err);
            }
          }
        }

        doc
          .fontSize(10)
          .fillColor('#7f8c8d')
          .text(`Generated on: ${new Date(report.generated_on || new Date()).toLocaleString()}`, { align: 'center' })
          .moveDown(2);

        // Report Status
        if (report.status) {
          doc
            .fontSize(12)
            .fillColor('#27ae60')
            .text(`Report Status: ${report.status.toUpperCase()}`, { align: 'center' })
            .moveDown();
        }

        // Basic Information Section
        this.addSection(doc, 'Basic Information');
        this.addKeyValue(doc, 'Sample ID', sample.sample_identifier || 'N/A');
        this.addKeyValue(doc, 'Sample Type', sample.sample_type || 'N/A');
        this.addKeyValue(
          doc, 
          'Collection Date', 
          sample.collection_datetime 
            ? new Date(sample.collection_datetime).toLocaleString() 
            : 'N/A'
        );
        this.addKeyValue(doc, 'Status', sample.status || 'Active');
        doc.moveDown();

        // Location Information Section
        this.addSection(doc, 'Location Information');
        this.addKeyValue(doc, 'Geolocation', sample.geolocation || 'Not specified');
        if (sample.latitude && sample.longitude) {
          this.addKeyValue(doc, 'Latitude', sample.latitude.toString());
          this.addKeyValue(doc, 'Longitude', sample.longitude.toString());
          this.addKeyValue(
            doc,
            'Google Maps',
            `https://www.google.com/maps?q=${sample.latitude},${sample.longitude}`
          );
        } else {
          this.addKeyValue(doc, 'Coordinates', 'Not available');
        }
        doc.moveDown();

        // Environmental Conditions Section
        this.addSection(doc, 'Environmental Conditions');
        
        const conditions = [
          { label: 'pH Level', value: sample.ph, unit: '' },
          { label: 'Temperature', value: sample.temperature, unit: '°C' },
          { label: 'Salinity', value: sample.salinity, unit: 'ppt' }
        ];

        conditions.forEach(condition => {
          if (condition.value !== null && condition.value !== undefined) {
            this.addKeyValue(doc, condition.label, `${condition.value}${condition.unit}`);
          } else {
            this.addKeyValue(doc, condition.label, 'Not measured');
          }
        });
        doc.moveDown();

        // Notes Section
        if (sample.notes) {
          this.addSection(doc, 'Field Notes');
          doc
            .fontSize(10)
            .fillColor('#2c3e50')
            .text(sample.notes, { align: 'left', lineGap: 5 })
            .moveDown();
        }

        // Report-specific content (if available)
        if (report.chart_data) {
          try {
            const chartData = typeof report.chart_data === 'string' 
              ? JSON.parse(report.chart_data) 
              : report.chart_data;
            
            if (chartData.content) {
              this.addSection(doc, 'Report Analysis');
              doc
                .fontSize(10)
                .fillColor('#2c3e50')
                .text(chartData.content, { align: 'left', lineGap: 5 })
                .moveDown();
            }
          } catch (err) {
            console.error('Failed to parse chart_data:', err);
          }
        }

        // Metadata Section
        this.addSection(doc, 'Metadata');
        this.addKeyValue(
          doc, 
          'Report Generated', 
          report.generated_on 
            ? new Date(report.generated_on).toLocaleString() 
            : 'N/A'
        );
        this.addKeyValue(
          doc, 
          'Sample Created', 
          sample.created_at 
            ? new Date(sample.created_at).toLocaleString() 
            : 'N/A'
        );
        this.addKeyValue(
          doc, 
          'Last Updated', 
          new Date(sample.updated_at || sample.created_at || new Date()).toLocaleString()
        );
        this.addKeyValue(doc, 'Sample Database ID', sample.samples_id || 'N/A');
        this.addKeyValue(doc, 'Report Database ID', report.report_id || 'N/A');

        // Footer
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          doc
            .fontSize(8)
            .fillColor('#95a5a6')
            .text(
              `Page ${i + 1} of ${pages.count} | Mobile Bio Lab - ABC Laboratories`,
              50,
              doc.page.height - 50,
              { align: 'center' }
            );
        }

        doc.end();
      } catch (error) {
        console.error('PDF Generation Error:', error);
        reject(error);
      }
    });
  }

  addSection(doc, title) {
    doc
      .fontSize(14)
      .fillColor('#34495e')
      .text(title, { underline: true })
      .moveDown(0.5);
  }

  addKeyValue(doc, key, value) {
    const displayValue = value !== null && value !== undefined ? value.toString() : 'N/A';
    doc
      .fontSize(10)
      .fillColor('#7f8c8d')
      .text(key + ':', { continued: true })
      .fillColor('#2c3e50')
      .text(' ' + displayValue)
      .moveDown(0.3);
  }
}

module.exports = new PDFGenerator();