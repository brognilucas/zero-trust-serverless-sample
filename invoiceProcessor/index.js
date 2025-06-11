export const handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  console.log("Processing invoice...");

  console.log("has been processed successfully.");

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Invoice ${event.fileName} processed successfully!`
    })
  };
}