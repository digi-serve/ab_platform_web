/*Thai (Thailand) locale
 * modified to use Budhist Era Years
 */

webix.i18n.locales["th-TH"] = {
   groupDelimiter: ",",
   groupSize: 3,
   decimalDelimiter: ".",
   decimalSize: 2,
   dateFormat: (date) => {
      if (date == null) return "";
      else if (typeof date == "string") return date;

      const format = webix.Date.dateToStr(`%j/%m/${date.getFullYear() + 543}`);
      return format(date);
   },
   timeFormat: "%G:%i",
   longDateFormat: (date) => {
      if (date == null) return "";
      else if (typeof date == "string") return date;

      const format = webix.Date.dateToStr(`%j %F ${date.getFullYear() + 543}`);
      return format(date);
   },
   fullDateFormat: (date) => {
      if (date == null) return "";
      else if (typeof date == "string") return date;

      const format = webix.Date.dateToStr(
         `%j %F ${date.getFullYear() + 543} %G:%i`
      );
      return format(date);
   },
   am: ["am", "AM"],
   pm: ["pm", "PM"],
   price: "฿{obj}",
   priceSettings: {
      groupDelimiter: ",",
      groupSize: 3,
      decimalDelimiter: ".",
      decimalSize: 2,
   },
   calendar: {
      monthFull: [
         "มกราคม",
         "กุมภาพันธ์",
         "มีนาคม",
         "เมษายน",
         "พฤษภาคม",
         "มิถุนายน",
         "กรกฎาคม",
         "สิงหาคม",
         "กันยายน",
         "ตุลาคม",
         "พฤศจิกายน",
         "ธันวาคม",
      ],
      monthShort: [
         "ม.ค.",
         "ก.พ.",
         "มี.ค.",
         "เม.ย.",
         "พ.ค.",
         "มิ.ย.",
         "ก.ค.",
         "ส.ค.",
         "ก.ย.",
         "ต.ค.",
         "พ.ย.",
         "ธ.ค.",
      ],
      dayFull: [
         "อาทิตย์",
         "จันทร์",
         "อังคาร",
         "พุธ",
         "พฤหัสบดี",
         "ศุกร์",
         "เสาร์",
      ],
      dayShort: ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."],
   },
   aria: {
      dateFormat: (date) => {
         if (date == null) return "";
         else if (typeof date == "string") return date;

         const format = webix.Date.dateToStr(
            `%d %F ${date.getFullYear() + 543}`
         );
         return format(date);
      },
      monthFormat: (date) => {
         if (date == null) return "";
         else if (typeof date == "string") return date;

         const format = webix.Date.dateToStr(`%F ${date.getFullYear() + 543}`);
         return format(date);
      },
      yearFormat: (date) => {
         if (date == null) return "";
         else if (typeof date == "string") return date;

         const format = webix.Date.dateToStr(`${date.getFullYear() + 543}`);
         return format(date);
      },
   },
};
