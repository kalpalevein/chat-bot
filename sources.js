// Add new reference material here, then run: npm run ingest
//
// type: "url"  -> value is a publicly accessible web page, fetched and
//                 stripped down to readable text at ingest time.
// type: "file" -> value is a path (relative to server/) to a file in
//                 assets/docs — supports .pdf, .docx, .txt, .md

module.exports = [
  {
    id: "haleema-home",
    type: "url",
    value: "https://dev.skinaestheticshaleema.co.uk/",
  },
  {
    id: "haleema-results",
    type: "url",
    value: "https://dev.skinaestheticshaleema.co.uk/results/",
  },

  // Examples for when more sources are added later:
  // {
  //   id: "haleema-faqs",
  //   type: "url",
  //   value: "https://dev.skinaestheticshaleema.co.uk/faqs",
  // },
  // {
  //   id: "aftercare-guide",
  //   type: "file",
  //   value: "./assets/docs/aftercare-guide.pdf",
  // },
];
