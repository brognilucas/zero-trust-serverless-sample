export class GeminiService {

  async parseInvoice(file) {
    const apiUrl = process.env.GEMINI_API_URL;
    const apiKey = process.env.GEMINI_API_KEY;

    const url = `${apiUrl}${apiKey}`;

    let chatHistory = [];

    chatHistory.push({
      role: "user",
      parts: [{
        text: `You are an invoice parser bot. Parse the following invoice into a JSON object with the exact structure shown below. Ensure all fields match the format exactly and no null values are present:

{
    "invoiceId": "string",
    "date": "string (MM/DD/YYYY)",
    "dueDate": "string (MM/DD/YYYY)",
    "customer": {
      "name": "string",
      "address": "string",
      "email": "string",
    },
    "shipTo": {
        "name": "string",
        "address": "string"
    },
    "items": [
        {
            "date": "string (MM/DD/YYYY)",
            "description": "string",
            "quantity": number,
            "rate": number,
            "amount": number
        }
    ],
    "totalTaxAmount": number,
    "vatRate": number,
    "totalAmount": number,
    "company": {
        "name": "string",
        "address": "string",
        "email": "string"
    },
    "terms": "string"
}

For null values, return an empty string instead. Numbers use 0 as default.
`
      }]
    });

    const base64EncodedFile = file.toString('base64');

    chatHistory[0].parts.push({
      inlineData: {
        mimeType: 'application/pdf',
        data: base64EncodedFile
      }
    });
    
    const payload = { contents: chatHistory };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Gemini API error: ${response.status} - ${errorBody}`);
      throw new Error(`Gemini API request failed with status ${response.status}`);
    }

    const result = await response.json();

    if (result.candidates && result.candidates.length > 0 &&
      result.candidates[0].content && result.candidates[0].content.parts &&
      result.candidates[0].content.parts.length > 0) {
      return this.parseInvoiceToObject(result.candidates[0].content.parts[0].text);
    } else {
      console.error("Gemini API response did not contain expected content structure:", result);
      throw new Error("Failed to get a valid response from Gemini API.");
    }
  }

  async parseInvoiceToObject(jsonString) {
    try {
      const cleanJson = jsonString
        .replace(/```json\n?/, '')
        .replace(/```\n?/, '')
        .trim();

      const invoiceObject = JSON.parse(cleanJson);
      return invoiceObject;
    } catch (error) {
      throw new Error('Invalid JSON string');
    }
  }
}