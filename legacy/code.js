function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('LR Entry Form')
    .setFaviconUrl('https://www.google.com/images/favicon.ico');
}

function getFormData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dropdownSheet = ss.getSheetByName('Dropdown');

  if (!dropdownSheet) {
    return { clients: [], brokerMappings: {}, qualities: [], transports: [] };
  }

  const data = dropdownSheet.getDataRange().getValues();
  if (data.length === 0) {
    return { clients: [], brokerMappings: {}, qualities: [], transports: [] };
  }

  data.shift(); // Remove headers

  // Get unique clients, qualities, and transports
  const clients = [...new Set(data.map((row) => row[0]))].filter(Boolean);
  const qualities = [...new Set(data.map((row) => row[2]))].filter(Boolean);
  const transports = [...new Set(data.map((row) => row[3]))].filter(Boolean);

  // Build brokerMappings: each client can map to one or more brokers.
  const brokerMappings = {};
  data.forEach((row) => {
    const client = row[0];
    const broker = row[1];
    if (client && broker) {
      if (!brokerMappings[client]) {
        brokerMappings[client] = [];
      }
      if (brokerMappings[client].indexOf(broker) === -1) {
        brokerMappings[client].push(broker);
      }
    }
  });

  return {
    clients: clients,
    brokerMappings: brokerMappings,
    qualities: qualities,
    transports: transports
  };
}

function getBrokersByClient(clientName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Dropdown');
  if (!sheet) {
    return [];
  }
  const data = sheet.getDataRange().getValues();
  const brokers = [];
  data.forEach((row) => {
    if (row[0] === clientName && row[1]) {
      brokers.push(row[1]);
    }
  });
  return brokers;
}

function uploadFile(fileData, fileName) {
  try {
    // Folder ID where files will be saved
    const folderId = "193JX3IZF1wROnaAyypcYxR8_j6zbXDz5";
    const folder = DriveApp.getFolderById(folderId);
    if (fileData) {
      // Create the file from Base64 data (assumes fileData is a data URL)
      const decoded = Utilities.base64Decode(fileData.split(",")[1]);
      const file = folder.createFile(decoded, fileName);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return file.getUrl();
    } else {
      return null;
    }
  } catch (error) {
    Logger.log("Error uploading file: " + error.toString());
    return null;
  }
}

function submitForm(formData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Kalbadevi Office Entry');
  const idTrackerSheet = ss.getSheetByName('ID Tracker');

  if (!sheet || !idTrackerSheet) {
    throw new Error("Sheet 'Kalbadevi Office Entry' or 'ID Tracker' not found");
  }

  // Validate required fields
  if (!formData.billNo || !formData.clientName || !formData.brokerName) {
    throw new Error("Bill No, Client Name, and Broker Name are required fields.");
  }

  // Get the last used unique ID from the 'ID Tracker' sheet
  let lastUsedId = idTrackerSheet.getRange('A2').getValue();
  if (!lastUsedId || !/^LD-\d{4}$/.test(lastUsedId)) {
    lastUsedId = 'LD-0000'; // Start from LD-0000 if no valid ID is found
  }

  // Increment the ID (remove 'LD-' and pad the number)
  const currentNumber = parseInt(lastUsedId.split('-')[1], 10);
  const nextNumber = currentNumber + 1;
  const newUniqueId = 'LD-' + Utilities.formatString('%04d', nextNumber); // Format to 4 digits

  // Update the 'ID Tracker' sheet with the new ID (in A2)
  idTrackerSheet.getRange('A2').setValue(newUniqueId); // Store the new ID back in A2

  // Prepare data for submission
  const combinedQualities = (formData.qualities || []).join("|");
  const combinedQuantities = (formData.quantities || []).join("|");
  const combinedPieces = (formData.pieces || []).join("|");

  let attachmentLink = "";
  if (formData.fileData && formData.fileName) {
    attachmentLink = uploadFile(formData.fileData, formData.fileName);
  }

  const rowData = [
    newUniqueId, // Use the new unique ID
    formData.billNo,
    formData.entryFor,
    formData.trackingNo,
    formData.dated,
    formData.postedOn,
    formData.clientName,
    formData.brokerName,
    combinedQualities,
    combinedQuantities,
    combinedPieces,
    formData.transportName,
    formData.totalValue,
    formData.transportValue,
    formData.otherCharges,
    formData.returnReason,
    attachmentLink
  ];

  sheet.appendRow(rowData);
  return true;
}


function onEdit(e) {
  if (!e) return; // Ensure the event object exists before proceeding
  
  var sheet = e.source.getSheetByName('Bhiwandi Office Entry');  // Set the sheet name
  var range = e.range;  // Get the edited range
  var column = range.getColumn();  // Get the column of the edited cell
  
  // Check if the edit happened in column T (20), from row 2 onwards, and if it's in the desired sheet
  if (sheet && column == 20 && range.getRow() >= 2) {
    var timestampCell = sheet.getRange(range.getRow(), 19);  // Get the corresponding cell in column S
    
    // Set the timestamp in column Q whenever there is an edit in column S
    timestampCell.setValue(new Date());  // Set the timestamp
  }
}

