"""Build the sample XLSX using only Python's standard library."""
import csv
from pathlib import Path
from xml.sax.saxutils import escape
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[1]
NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'

def column_name(index):
    text = ''
    while index:
        index, rem = divmod(index - 1, 26)
        text = chr(65 + rem) + text
    return text

with ZipFile(ROOT / 'examples/records.xlsx', 'w', ZIP_DEFLATED) as book:
    book.writestr('[Content_Types].xml', '''<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>''')
    book.writestr('_rels/.rels', '''<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>''')
    book.writestr('xl/workbook.xml', f'''<?xml version="1.0" encoding="UTF-8"?>
<workbook xmlns="{NS}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="With errors" sheetId="1" r:id="rId1"/><sheet name="Complete" sheetId="2" r:id="rId2"/></sheets></workbook>''')
    book.writestr('xl/_rels/workbook.xml.rels', '''<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
</Relationships>''')
    for index, filename in enumerate(['records-with-errors.csv', 'museum-and-sib-valid.csv'], 1):
        with (ROOT / 'examples' / filename).open() as source:
            rows = list(csv.reader(source))
        xml_rows = []
        for row_index, row in enumerate(rows, 1):
            cells = ''.join(f'<c r="{column_name(col)}{row_index}" t="inlineStr"><is><t>{escape(value)}</t></is></c>' for col, value in enumerate(row, 1))
            xml_rows.append(f'<row r="{row_index}">{cells}</row>')
        book.writestr(f'xl/worksheets/sheet{index}.xml', f'<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="{NS}"><sheetData>{"".join(xml_rows)}</sheetData></worksheet>')
print('Generated examples/records.xlsx (two sheets).')
