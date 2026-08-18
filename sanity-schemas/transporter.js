export default {
  name: "transporter",
  title: "Transporter",
  type: "document",
  fields: [
    { name: "name", title: "Transporter / owner name", type: "string", validation: (Rule) => Rule.required() },
    { name: "driver", title: "Driver name", type: "string" },
    { name: "mobile", title: "Mobile", type: "string" },
    { name: "truckNo", title: "Truck number", type: "string" },
    { name: "truckType", title: "Truck type", type: "string" },
    { name: "route", title: "Usual route", type: "string" },
    { name: "normalRate", title: "Normal rate", type: "number" },
    { name: "isDemo", title: "Demo record", type: "boolean", description: "Sample data created by the app's \"Load demo data\" button — safe to bulk-delete via \"Remove demo data\" before going live." },
  ],
  preview: {
    select: { title: "name", subtitle: "truckNo" },
  },
};
