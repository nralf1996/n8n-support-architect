"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const build_context_1 = require("../code_nodes/build_context");
const fetch_order_data_1 = require("../code_nodes/fetch_order_data");
const generate_draft_1 = require("../code_nodes/generate_draft");
function runTest() {
    const raw = (0, fs_1.readFileSync)("./tests/fake_emails.json", "utf-8");
    const emails = JSON.parse(raw);
    emails.forEach((email, index) => {
        const context = (0, build_context_1.buildSupportContext)({
            from: email.from || "customer@gmail.com",
            subject: email.subject || "",
            body: email.body
        });
        const enriched = (0, fetch_order_data_1.fetchOrderDataMock)(context);
        const draft = (0, generate_draft_1.generateDraft)(enriched.context, enriched.order_data);
        console.log("------");
        console.log("Email:", index + 1);
        console.log("Draft:\n", draft);
    });
}
runTest();
