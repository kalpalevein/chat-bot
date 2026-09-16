// Add new reference material here, then run: npm run ingest
//
// type: "url"  -> value is a publicly accessible web page, fetched and
//                 stripped down to readable text at ingest time.
// type: "file" -> value is a path (relative to server/) to a file in
//                 assets/docs — supports .pdf, .docx, .txt, .md

module.exports = [
  // {
  //   id: "haleema-home",
  //   type: "url",
  //   value: "https://dev.skinaestheticshaleema.co.uk/",
  // },
  // {
  //   id: "haleema-about",
  //   type: "url",
  //   value: "https://dev.skinaestheticshaleema.co.uk/about/",
  // },
  // {
  //   id: "haleema-consultation",
  //   type: "url",
  //   value: "https://dev.skinaestheticshaleema.co.uk/consultation/",
  // },
  // {
  //   id: "haleema-skin-treatments",
  //   type: "url",
  //   value: "https://dev.skinaestheticshaleema.co.uk/treatments/skin-treatments/",
  // },
  // {
  //   id: "haleema-injectables",
  //   type: "url",
  //   value: "https://dev.skinaestheticshaleema.co.uk/treatments/injectables/",
  // },
  // {
  //   id: "haleema-laser-hair-removal",
  //   type: "url",
  //   value: "https://dev.skinaestheticshaleema.co.uk/treatments/laser-hair-removal/",
  // },
  // {
  //   id: "haleema-wellness",
  //   type: "url",
  //   value: "https://dev.skinaestheticshaleema.co.uk/treatments/wellness/",
  // },
  // {
  //   id: "haleema-memberships",
  //   type: "url",
  //   value: "https://dev.skinaestheticshaleema.co.uk/memberships/",
  // },
  // {
  //   id: "haleema-results",
  //   type: "url",
  //   value: "https://dev.skinaestheticshaleema.co.uk/results/",
  // },

  // Examples for when more sources are added later:
  // {
  //   id: "haleema-treatments-overview",
  //   type: "file",
  //   value: "./assets/docs/treatments-overview.md",
  // },
  // {
  //   id: "haleema-team-bios",
  //   type: "file",
  //   value: "./assets/docs/team-bios.md",
  // },
  // {
  //   id: "haleema-membership-plans",
  //   type: "file",
  //   value: "./assets/docs/membership-plans.md",
  // },
  // {
  //   id: "haleema-consultation-faqs",
  //   type: "file",
  //   value: "./assets/docs/consultation-faqs.md",
  // },
  // {
  //   id: "haleema-skin-treatments-detail",
  //   type: "file",
  //   value: "./assets/docs/skin-treatments-detail.md",
  // },
  // {
  //   id: "haleema-injectables-detail",
  //   type: "file",
  //   value: "./assets/docs/injectables-detail.md",
  // },
  {
    id: "haleema-laser-hair-removal-detail",
    type: "file",
    value: "./assets/docs/laser-hair-removal-detail.md",
  },
  {
    id: "haleema-wellness-detail",
    type: "file",
    value: "./assets/docs/wellness-detail.md",
  },
];
