export default {
  name: "customer",
  title: "Customer",
  type: "document",
  fields: [
    { name: "name", title: "Company name", type: "string", validation: (Rule) => Rule.required() },
    { name: "contact", title: "Contact person", type: "string" },
    { name: "phone", title: "Phone", type: "string" },
    { name: "city", title: "City", type: "string" },
    { name: "address", title: "Address", type: "string" },
    { name: "terms", title: "Payment terms", type: "string" },
  ],
  preview: {
    select: { title: "name", subtitle: "city" },
  },
};
