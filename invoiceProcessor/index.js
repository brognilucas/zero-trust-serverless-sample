import { S3Service } from '../services/s3Service.js';
import { GeminiService } from '../services/geminiService.js';
import { DatabaseService } from '../database/database.js';

export const createHandler = (s3Service = new S3Service(), llmService = new GeminiService(), database = new DatabaseService()) => {
  return async (event) => {
    console.log("Received event:", JSON.stringify(event, null, 2));

    try {
      const key = decodeURIComponent(event.Records[0].s3.object.key);
      const {buffer} = await s3Service.getFile(key);
      const invoiceJson = await llmService.parseInvoice(buffer);
      console.log("INVOICE parsed to JSON:", invoiceJson);

      await database.createInvoice(invoiceJson); 

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: `Invoice successfully processed!`,
          parsedInvoice: invoiceJson
        })
      };
    } catch (error) {
      console.error("Error processing invoice:", error);
      
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Failed to process invoice',
          details: error.message
        })
      };
    }
  };
};

export const handler = createHandler();
