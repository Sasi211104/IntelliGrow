const { serve } = require("inngest/express");
const { inngest } = require("../inngest/client");
const { jobMarketRefresh } = require("../inngest/functions");

const router = serve({
    client: inngest,
    functions: [jobMarketRefresh],
});

module.exports = router;
