import { GeminiService } from '../services/geminiService';
import { jest } from '@jest/globals';

describe('GeminiService', () => {
  let geminiService;
  const mockInvoiceText = `Invoice #INV-2024-001
Date: 01/15/2024
Due Date: 02/15/2024

Bill To:
JOHN DOE
123 Business Avenue, Suite 100
New York, NY 10001

Ship To:
JOHN DOE
456 Corporate Plaza
New York, NY 10002

Items:
Date: 01/15/2024
Description: Professional Services
Quantity: 1
Rate: 1500
Amount: 1500

Total Amount: 1500

Company:
ACME CONSULTING LLC
789 Enterprise Street
contact@acmeconsulting.com

Terms: Net 30`;

  beforeEach(() => {
    geminiService = new GeminiService();
    process.env.GEMINI_API_URL = 'https://api.gemini.test/';
    process.env.GEMINI_API_KEY = 'test-key';
    
    global.fetch = jest.fn();
  });

  describe('parseInvoice', () => {
    it('should parse invoice text into the correct JSON format', async () => {
      const expectedFormat = {
        invoiceId: "INV-2024-001",
        date: "01/15/2024",
        dueDate: "02/15/2024",
        customer: {
          name: "JOHN DOE",
          address: "123 Business Avenue, Suite 100, New York, NY 10001",
          email: ""
        },
        shipTo: {
          name: "JOHN DOE",
          address: "456 Corporate Plaza, New York, NY 10002"
        },
        items: [
          {
            date: "01/15/2024",
            description: "Professional Services",
            quantity: 1,
            rate: 1500,
            amount: 1500
          }
        ],
        totalTaxAmount: 0,
        vatRate: 0,
        totalAmount: 1500,
        company: {
          name: "ACME CONSULTING LLC",
          address: "789 Enterprise Street",
          email: "contact@acmeconsulting.com"
        },
        terms: "Net 30"
      };

      global.fetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify(expectedFormat) }]
            }
          }]
        })
      });

      const result = await geminiService.parseInvoice(mockInvoiceText);
      expect(result).toEqual(expectedFormat);
    });

    it('should throw an error when API response is invalid', async () => {
      global.fetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ candidates: [] })
      });

      await expect(geminiService.parseInvoice(mockInvoiceText))
        .rejects
        .toThrow('Failed to get a valid response from Gemini API.');
    });
  });

  describe('parseInvoiceToObject', () => {
    it('should parse invoice JSON string into a manipulable object', async () => {
      const mockInvoiceJson = JSON.stringify({
        invoiceId: "INV-2024-001",
        date: "01/15/2024",
        dueDate: "02/15/2024",
        customer: {
          name: "John Smith",
          address: "123 Business Street, Suite 100, New York, NY 10001",
          email: "john.smith@example.com"
        },
        shipTo: {
          name: "John Smith",
          address: "456 Corporate Plaza, New York, NY 10002"
        },
        items: [
          {
            date: "01/15/2024",
            description: "Professional Services",
            quantity: 1,
            rate: 1500,
            amount: 1500
          }
        ],
        totalTaxAmount: 150,
        vatRate: 10,
        totalAmount: 1650,
        company: {
          name: "ACME Consulting LLC",
          address: "789 Enterprise Street, New York, NY 10003",
          email: "contact@acmeconsulting.com"
        },
        terms: "Net 30"
      });

      const result = await geminiService.parseInvoiceToObject(mockInvoiceJson);
      
      expect(result.invoiceId).toBe("INV-2024-001");
      expect(result.customer.name).toBe("John Smith");
      expect(result.items[0].amount).toBe(1500);
      expect(result.totalAmount).toBe(1650);
    });

    it('should throw an error when JSON string is invalid', async () => {
      const invalidJson = 'invalid json string';
      
      await expect(geminiService.parseInvoiceToObject(invalidJson))
        .rejects
        .toThrow('Invalid JSON string');
    });
  });
}); 