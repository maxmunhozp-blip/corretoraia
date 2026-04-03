import jsPDF from "jspdf";
import { drawCover } from "./pdf/pageCover";
import { drawExecutiveSummary } from "./pdf/pageExecutiveSummary";
import { drawConditionsAndBenefits } from "./pdf/pageConditions";
import { drawCoverageTable } from "./pdf/pageCoverage";
import { drawNarrativeAndSignature } from "./pdf/pageSignature";
import { drawFooter } from "./pdf/drawUtils";

// Re-export for backward compatibility
export type { DadosProposta } from "./pdf/helpers";

export function gerarPropostaPdf(dados: import("./pdf/helpers").DadosProposta): Blob {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Page 1: Cover
  drawCover(doc, dados);

  // Page 2: Executive Summary + Financial
  doc.addPage();
  drawExecutiveSummary(doc, dados);

  // Page 3: Conditions + Commercial Terms + Benefits
  doc.addPage();
  drawConditionsAndBenefits(doc, dados);

  // Page 4: Coverage Table
  doc.addPage();
  drawCoverageTable(doc, dados);

  // Page 5: Narrative + Next Steps + Signature
  doc.addPage();
  drawNarrativeAndSignature(doc, dados);

  // Footers with page numbers
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);
    drawFooter(doc, page === 1, page, total);
  }

  return doc.output("blob");
}
