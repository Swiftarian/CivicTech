import os
import sys
from utils import convert_doc_to_pdf, get_libreoffice_path

def test_conversion():
    print("Checking for LibreOffice...")
    lo_path = get_libreoffice_path()
    if lo_path:
        print(f"LibreOffice found at: {lo_path}")
    else:
        print("LibreOffice NOT found. Will fall back to Word COM.")

    # Create a dummy docx file
    docx_path = os.path.abspath("test_conversion.docx")
    try:
        import docx
        doc = docx.Document()
        doc.add_paragraph("This is a test document for PDF conversion.")
        doc.save(docx_path)
        print(f"Created dummy DOCX at: {docx_path}")
    except ImportError:
        print("python-docx not installed, creating an empty file (might fail conversion if strict)")
        with open(docx_path, "w") as f:
            f.write("Dummy content")
    
    print("Starting conversion...")
    try:
        pdf_path = convert_doc_to_pdf(docx_path)
        print(f"Conversion successful! PDF saved at: {pdf_path}")
        
        if os.path.exists(pdf_path):
            print("PDF file exists.")
            # Clean up
            os.remove(pdf_path)
            print("Cleaned up PDF.")
        else:
            print("Error: PDF file reported as created but not found.")
            
    except Exception as e:
        print(f"Conversion FAILED: {e}")
    finally:
        if os.path.exists(docx_path):
            os.remove(docx_path)
            print("Cleaned up DOCX.")

if __name__ == "__main__":
    # Install python-docx if needed for the test
    try:
        import docx
    except ImportError:
        print("Installing python-docx for test generation...")
        os.system(f"{sys.executable} -m pip install python-docx")
        
    test_conversion()
