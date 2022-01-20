var L = null;
// multilingual Label fn()

module.exports = class CSVImporter {
   constructor(Label) {
      // {ABMultilingual.label()} function.
      //
      if (!L) {
         L = Label;

         // if this was a v1: App param:
         if (Label.Label) {
            L = Label.Label;
         }
      }
   }

   /**
    * @method getSeparateItems()
    * Return the options of how the CSV values are separated.
    * @return {array}  [ {id, value} ... ]
    */
   getSeparateItems() {
      return [
         { id: ",", value: L("Comma (,)") },
         { id: "\t", value: L("Tab (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)") },
         { id: ";", value: L("Semicolon (;)") },
         { id: "s", value: L("Space ( )") },
      ];
   }

   /**
    * @method validateFile
    * Validate file extension
    * @param {*} fileInfo
    *        https://docs.webix.com/api__ui.uploader_onbeforefileadd_event.html
    * @return {boolean}
    */
   validateFile(fileInfo) {
      if (!fileInfo || !fileInfo.file || !fileInfo.file.type) return false;

      // validate file type
      let extensionType = fileInfo.file.type.toLowerCase();
      if (
         extensionType == "text/csv" ||
         extensionType == "application/vnd.ms-excel"
      ) {
         return true;
      } else {
         return false;
      }
   }

   /**
    * @method getDataRows
    * Pull data rows from the CSV file
    *
    * @param {Object} fileInfo - https://docs.webix.com/api__ui.uploader_onbeforefileadd_event.html
    * @param {string} separatedBy
    *
    * @return {Promise} -[
    * 						["Value 1.1", "Value 1.2", "Value 1.3"],
    * 						["Value 2.1", "Value 2.2", "Value 2.3"],
    * 					]
    */
   getDataRows(fileInfo, separatedBy) {
      if (!this.validateFile(fileInfo)) return Promise.reject();

      return new Promise((resolve, reject) => {
         // read CSV file
         let reader = new window.FileReader();
         reader.onload = (e) => {
            let result = [];

            // split lines
            let dataRows = reader.result
               .split(/\r\n|\n|\r/) // CRLF = \r\n; LF = \n; CR = \r;
               .filter((row) => row && row.length > 0);

            // split columns
            (dataRows || []).forEach((row) => {
               let dataCols = [];
               if (separatedBy == ",") {
                  // NOTE: if the file contains ,, .match() can not reconize this empty string
                  row = row.replace(/,,/g, ", ,");

                  // https://stackoverflow.com/questions/11456850/split-a-string-by-commas-but-ignore-commas-within-double-quotes-using-javascript#answer-11457952
                  dataCols = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
               } else {
                  dataCols = row.split(separatedBy);
               }

               result.push(dataCols.map((dCol) => this.reformat(dCol)));
            });

            resolve(result);
         };
         reader.readAsText(fileInfo.file);
      });
   }

   /**
    * @method getGuessDataType
    * return our best guess of what type of data for the requested column.
    * @param {array} dataRows
    *        The data we are evaluating:
    *        [
    *           ["Value 1.1", "Value 1.2", "Value 1.3"],
    *           ["Value 2.1", "Value 2.2", "Value 2.3"],
    * 		 ]
    * @param colIndex {Number}
    * @return {string}
    */
   getGuessDataType(dataRows, colIndex) {
      var data,
         // {various} the data pulled from the requested row/column
         repeatNum = 10;
      // {integer} how many rows do we want to scan trying to find a value

      // Loop to find a value
      for (var i = 1; i <= repeatNum; i++) {
         var line = dataRows[i];
         if (!line) break;

         data = line[colIndex];

         if (data != null && data.length > 0) break;
      }

      if (data == null || data == "") {
         return "string";
      } else if (
         data == 0 ||
         data == 1 ||
         data == true ||
         data == false ||
         data == "checked" ||
         data == "unchecked"
      ) {
         return "boolean";
      } else if (!isNaN(data)) {
         return "number";
      } else if (Date.parse(data)) {
         return "date";
      } else {
         // determine which type of string this might be:
         if (data.length > 100) return "LongText";
         else return "string";
      }
   }

   /**
    * @method reformat
    * @param {string} str
    */
   reformat(str) {
      if (!str) return "";

      return str.trim().replace(/"/g, "").replace(/'/g, "");
   }
};
