import pdfplumber
import json

pdf_path = r"d:\Downloads\ad0385840A6EA92-A03A-4C04-B6B2-F39EFFDBF697}1.pdf"

with pdfplumber.open(pdf_path) as pdf:
    # Analyze first page
    first_page = pdf.pages[0]
    
    print("=" * 80)
    print("PDF STRUCTURE ANALYSIS")
    print("=" * 80)
    print(f"Total pages: {len(pdf.pages)}")
    print(f"First page size: {first_page.width} x {first_page.height}")
    print()
    
    # Extract tables
    print("=" * 80)
    print("TABLES FOUND ON PAGE 1:")
    print("=" * 80)
    tables = first_page.extract_tables()
    for i, table in enumerate(tables):
        print(f"\nTable {i+1}:")
        print(f"  Rows: {len(table)}")
        print(f"  Columns: {len(table[0]) if table else 0}")
        if table:
            print(f"  Headers: {table[0]}")
            if len(table) > 1:
                print(f"  First data row: {table[1]}")
            if len(table) > 2:
                print(f"  Second data row: {table[2]}")
    
    # Try with different table settings
    print("\n" + "=" * 80)
    print("TRYING DIFFERENT TABLE EXTRACTION SETTINGS:")
    print("=" * 80)
    
    table_settings = {
        "vertical_strategy": "lines",
        "horizontal_strategy": "lines",
    }
    
    tables2 = first_page.extract_tables(table_settings)
    for i, table in enumerate(tables2):
        print(f"\nTable {i+1} (with lines strategy):")
        print(f"  Rows: {len(table)}")
        if table:
            print(f"  Headers: {table[0]}")
            if len(table) > 1:
                print(f"  Sample row 1: {table[1]}")
    
    # Extract all text
    print("\n" + "=" * 80)
    print("RAW TEXT (first 2000 chars):")
    print("=" * 80)
    text = first_page.extract_text()
    print(text[:2000])
    
    # Analyze text with positions
    print("\n" + "=" * 80)
    print("TEXT WITH POSITIONS (first 20 items):")
    print("=" * 80)
    words = first_page.extract_words()
    for i, word in enumerate(words[:20]):
        print(f"{i}: x={word['x0']:.1f} y={word['top']:.1f} text='{word['text']}'")
    
    # Save full table data to JSON
    if tables:
        output_file = r"d:\selgros\protokoll2qr\pdf_table_data.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump({
                'page_count': len(pdf.pages),
                'tables': tables,
                'sample_words': words[:50]
            }, f, indent=2, ensure_ascii=False)
        print(f"\n\nFull table data saved to: {output_file}")
