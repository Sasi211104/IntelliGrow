const { Inngest } = require("inngest");

// Create a client to send and receive events
const inngest = new Inngest({ id: "intelligrow-app" });

module.exports = { inngest };
