/**
 * @OnlyCurrentDoc
 *
 * The above comment directs App Script to limit the scope of file
 * access for this script to only the current document.
 */

/**
 * A special function that runs when the spreadsheet is open, used to add a
 * custom menu to the spreadsheet.
 */
function onOpen() {
  SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .createMenu('Data Cleaner')
      .addItem('Clean and Process Data', 'cleanData')
      .addToUi();
}

/**
 * Cleans and processes the data from the 'import' sheet and outputs it to the 'Cleaned_Data' sheet.
 * It splits rows with multiple fabrics, quantities, and pcs into separate rows.
 */
function cleanData() {
  // Get the active spreadsheet.
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Get the source sheet ('import') and the target sheet ('Cleaned_Data').
  const importSheet = ss.getSheetByName('import');
  const cleanedDataSheet = ss.getSheetByName('Cleaned_Data');

  // Check if the sheets exist.
  if (!importSheet) {
    SpreadsheetApp.getUi().alert('Sheet "import" not found!');
    return;
  }
  if (!cleanedDataSheet) {
    SpreadsheetApp.getUi().alert('Sheet "Cleaned_Data" not found!');
    return;
  }

  // Clear the "Cleaned_Data" sheet to prevent duplicating data on subsequent runs.
  // We clear from the second row downwards to preserve the headers if they are already there.
  cleanedDataSheet.getRange(2, 1, cleanedDataSheet.getMaxRows() - 1, cleanedDataSheet.getMaxColumns()).clearContent();

  // Get all the data from the "import" sheet.
  const data = importSheet.getDataRange().getValues();

  // Get the headers from the first row of the "import" sheet.
  const headers = data[0];
  
  // Find the indices of the relevant columns.
  const fabricNameIndex = headers.indexOf('Fabric Name');
  const qtyIndex = headers.indexOf('QTY(In Mtr)');
  const pcsIndex = headers.indexOf('PCS');

  // Check if all required columns are present.
  if (fabricNameIndex === -1 || qtyIndex === -1 || pcsIndex === -1) {
    SpreadsheetApp.getUi().alert('One or more required columns (Fabric Name, QTY(In Mtr), PCS) are missing in the "import" sheet.');
    return;
  }

  // Add a new header for the status column to handle potential errors.
  const newHeaders = [...headers, "Processing Status"];

  // Write the new, extended headers to the "Cleaned_Data" sheet.
  cleanedDataSheet.getRange(1, 1, 1, newHeaders.length).setValues([newHeaders]);

  // This array will hold all the new rows to be written to the sheet.
  const newRows = [];

  // Loop through each row of the data, starting from the second row (index 1) to skip the header row.
  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    // Skip any completely empty rows in the source data.
    if (row.join("").trim() === "") continue;

    // Get the values from the columns that need to be split.
    // We use a regular expression to split by either "|" or "/" and then filter out any empty results.
    const fabricNames = String(row[fabricNameIndex]).split(/[|\/]/).filter(item => item.trim() !== '');
    const quantities = String(row[qtyIndex]).split(/[|\/]/).filter(item => item.trim() !== '');
    const pcs = String(row[pcsIndex]).split(/[|\/]/).filter(item => item.trim() !== '');
    
    // Determine the maximum number of items in any of the columns to decide how many rows to create.
    const maxLength = Math.max(fabricNames.length, quantities.length, pcs.length);

    // If maxLength is 0 or 1, it's a single-entry row, so we just copy it as is.
    if (maxLength <= 1) {
        const newRow = [...row];
        newRow.push(""); // Add empty status
        newRows.push(newRow);
        continue;
    }

    // If there are multiple items, expand them into separate rows.
    for (let j = 0; j < maxLength; j++) {
        const newRow = [...row];

        // For each column, use the value at the current index 'j'.
        // If the array is shorter (e.g., it only had one item), repeat its first item.
        // Use a fallback of "" for the value to avoid errors with empty cells.
        newRow[fabricNameIndex] = (fabricNames[j] || fabricNames[0] || "").trim();
        newRow[qtyIndex] = (quantities[j] || quantities[0] || "").trim();
        newRow[pcsIndex] = (pcs[j] || pcs[0] || "").trim();

        newRow.push(""); // Add empty status for successfully processed rows
        newRows.push(newRow);
    }
  }

  // Check if there are any new rows to write.
  if (newRows.length > 0) {
    // Write all the newly created rows to the "Cleaned_Data" sheet in one go for efficiency.
    cleanedDataSheet.getRange(2, 1, newRows.length, newRows[0].length).setValues(newRows);
  }
  
  // Display a message to the user indicating that the process is complete.
  SpreadsheetApp.getUi().alert('Data has been successfully cleaned and processed!');
}
