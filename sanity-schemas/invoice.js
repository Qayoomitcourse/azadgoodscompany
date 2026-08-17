export default {
  name: "invoice",
  title: "Invoice",
  type: "document",
  fields: [
    { name: "serial", title: "Serial", type: "string", validation: (Rule) => Rule.required() },
    { name: "customerId", title: "Customer ID", type: "string" },
    { name: "generatedDate", title: "Generated date", type: "date" },
    // Sanity _id strings of the shipment documents this bill covers.
    { name: "shipmentIds", title: "Shipment IDs", type: "array", of: [{ type: "string" }] },
    { name: "total", title: "Total", type: "number" },
    {
      name: "payment",
      title: "Payment",
      type: "object",
      fields: [
        { name: "amount", title: "Amount", type: "number" },
        { name: "method", title: "Method", type: "string" },
        { name: "ref", title: "Reference", type: "string" },
        { name: "date", title: "Date", type: "date" },
      ],
    },
    { name: "previousBalance", title: "Previous balance", type: "number" },
    { name: "previousBalanceRefs", title: "Previous balance refs", type: "array", of: [{ type: "string" }] },
    { name: "carriedForward", title: "Carried forward", type: "boolean" },
  ],
  preview: {
    select: { title: "serial", subtitle: "customerId" },
  },
};
