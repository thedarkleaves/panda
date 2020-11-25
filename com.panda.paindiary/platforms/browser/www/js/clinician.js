import { jsPDF } from "jspdf";

function makepdf() {
    var doc = new jsPDF();

    doc.text("Hello world!", 10, 10);
    doc.save("a4.pdf");
    console.log("trying...")
}