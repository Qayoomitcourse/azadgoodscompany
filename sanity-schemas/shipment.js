export default {
  name: "shipment",
  title: "Shipment",
  type: "document",
  fields: [
    { name: "orderNo", title: "Order number", type: "string" },
    { name: "date", title: "Date", type: "date" },
    // Stored as the Sanity _id string of a customer/transporter document
    // (not a Sanity `reference`) so the existing customerById()/
    // transporterById() lookups in App.jsx keep working unchanged.
    { name: "customerId", title: "Customer ID", type: "string", validation: (Rule) => Rule.required() },
    // Per-trip truck/vehicle number. Kept separate from the transporter's
    // own truckNo because the same transporter can send different trucks
    // on different trips (see the printed register: truck no. varies row
    // to row even when the same parties recur). Required.
    { name: "vehicleNo", title: "Vehicle number", type: "string", validation: (Rule) => Rule.required() },
    { name: "item", title: "Item", type: "string" },
    { name: "qty", title: "Quantity", type: "string" },
    { name: "pickup", title: "Pickup", type: "string" },
    { name: "delivery", title: "Delivery", type: "string" },
    { name: "truckType", title: "Truck type", type: "string" },
    { name: "customerRate", title: "Customer rate", type: "number" },
    { name: "transporterId", title: "Transporter ID", type: "string" },
    { name: "transporterRate", title: "Transporter rate", type: "number" },
    { name: "labour", title: "Labour", type: "number" },
    { name: "other", title: "Other charges", type: "number" },
    { name: "receiver", title: "Receiver", type: "string" },
    {
      name: "status",
      title: "Status",
      type: "string",
      options: { list: ["Pending", "In Transit", "Delivered"] },
    },
    { name: "transporterPaid", title: "Transporter paid", type: "number" },
    { name: "invoiced", title: "Invoiced", type: "boolean" },
    { name: "invoiceSerial", title: "Invoice serial", type: "string" },
    { name: "transporterPayMethod", title: "Transporter pay method", type: "string" },
    { name: "transporterPayRef", title: "Transporter pay reference", type: "string" },
    { name: "isDemo", title: "Demo record", type: "boolean", description: "Sample data created by the app's \"Load demo data\" button — safe to bulk-delete via \"Remove demo data\" before going live." },
  ],
  preview: {
    select: { title: "orderNo", subtitle: "item" },
  },
};
