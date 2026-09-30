-- Ampliar CHECK constraint de file_type en drive_files
-- El constraint anterior solo incluía pdf,dwg,dxf,xlsx,docx,img,other
-- pero el código puede detectar: pptx,ppt,xls,doc,zip,rar

ALTER TABLE drive_files DROP CONSTRAINT IF EXISTS drive_files_file_type_check;

ALTER TABLE drive_files ADD CONSTRAINT drive_files_file_type_check
  CHECK (file_type IN ('pdf','dwg','dxf','xlsx','xls','docx','doc','pptx','ppt','img','zip','rar','other'));
