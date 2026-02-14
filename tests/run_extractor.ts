import { readFileSync } from "fs";
import { buildSupportContext } from "../code_nodes/build_context";
import { fetchOrderDataMock } from "../code_nodes/fetch_order_data";
import { generateDraft } from "../code_nodes/generate_draft";

function runTest() {
  const raw = readFileSync("./tests/fake_emails.json", "utf-8");
  const emails = JSON.parse(raw);

  emails.forEach((email: any, index: number) => {
    const context = buildSupportContext({
      from: email.from || "customer@gmail.com",
      subject: email.subject || "",
      body: email.body
    });

    const enriched = fetchOrderDataMock(context);

    const draft = generateDraft(enriched.context, enriched.order_data);

    console.log("------");
    console.log("Email:", index + 1);
    console.log("Draft:\n", draft);
  });
}

runTest();
