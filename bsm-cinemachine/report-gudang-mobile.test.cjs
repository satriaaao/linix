const assert = require('assert');
const fs = require('fs');
const ui = require('./report-gudang-ui.js');
const adminMatrix = require('./report-admin-matrix.js');
const cameraVendor = require('./report-camera-vendor.js');
const cameraReports = require('./report-camera-reports.js');
const bulkRouter = require('./report-bulk-router.js');
const liveEdit = require('./report-live-edit.js');
const slideFit = require('./report-slide-fit.js');
const audioReports = require('./report-audio-reports.js');
const cinemaReports = require('./report-cinema-reports.js');
const lightingReports = require('./report-lighting-reports.js');

const phone = ui.getPreviewLayout(390, 10);
assert.strictEqual(phone.canvasWidth, 1600);
assert.strictEqual(phone.canvasHeight, 900);
assert.strictEqual(phone.viewportWidth, 370);
assert.strictEqual(phone.viewportHeight, 208.125);
assert.strictEqual(phone.scale, 370 / 1600);

const desktop = ui.getPreviewLayout(1920, 24);
assert.strictEqual(desktop.canvasWidth, 1600);
assert.strictEqual(desktop.canvasHeight, 900);
assert.strictEqual(desktop.scale, 1);

const narrow = ui.getPreviewLayout(320, 10);
assert.strictEqual(narrow.viewportWidth, 300);
assert.strictEqual(narrow.viewportHeight, 168.75);

const html = fs.readFileSync('./bsm-cinemachine/report-gudang.html','utf8');
const pageSizeRule='@page{size:13.333in 7.5in;margin:0}';
assert(html.includes(pageSizeRule));
assert.strictEqual((html.match(/@page\{/g)||[]).length,1,'PDF harus hanya punya satu aturan @page 16:9');
assert(!/A4/i.test(html),'PDF tidak boleh memakai ukuran A4');
assert(html.includes('.print-page{width:13.333in;height:7.5in;'));
assert(html.includes('.print-canvas{width:1600px;height:900px;transform:scale(.8)'));
assert(html.includes('html2canvas.min.js'),'direct PDF harus memuat html2canvas');
assert(html.includes('jspdf.umd.min.js'),'direct PDF harus memuat jsPDF');
assert(html.includes('function downloadPdf16x9()'),'harus ada generator download PDF langsung');
assert(html.includes('if(kind===\"pdf\"){closeSidebar();downloadPdf16x9();return;}'),'menu PDF harus download langsung');
assert(!html.includes('if(kind===\"pdf\"){closeSidebar();renderPrintStack();setTimeout(function(){window.print();},60);return;}'),'menu PDF tidak boleh membuka dialog print');
assert(html.includes('width:1600px!important;height:900px!important'));
assert(html.includes('id="previewViewport"'));
assert(html.includes('id="previewCanvas"'));
assert(html.includes('id="downloadsPage"'));
assert(html.includes('id="typesPage"'));
assert(html.includes('id="coverPage"'));
assert(html.includes('id="tablePage"'));
assert(html.includes('id="previewPage"'));
assert(html.includes('page-break-after:always'));
assert(html.includes('.top-actions .btn.menu-toggle#menuToggle{'));
assert(!html.includes('body:not(.mobile-preview) .report-zone{display:none}'));
assert(html.includes('id="presentationBtn"'),'Preview Master harus punya tombol Presentasi');
assert(html.includes('id="presentationExitBtn"'),'Mode presentasi harus punya tombol Keluar');
assert(html.includes('function enterPresentation()'),'harus ada fungsi masuk mode presentasi');
assert(html.includes('function exitPresentation()'),'harus ada fungsi keluar mode presentasi');
assert(html.includes('document.documentElement.requestFullscreen'),'harus mencoba fullscreen browser');
assert(html.includes('document.exitFullscreen'),'harus bisa keluar fullscreen browser');
assert(html.includes('body.presentation-mode'),'harus ada layout khusus mode presentasi');
assert(html.includes('e.key==="ArrowRight"'),'keyboard kanan harus pindah slide');
assert(html.includes('e.key==="ArrowLeft"'),'keyboard kiri harus pindah slide');
assert(html.includes('e.key==="Escape"'),'Escape harus keluar mode presentasi');
assert(html.includes('presentation-controls'),'harus ada kontrol presentasi yang tipis');
assert(html.includes('/report-admin-matrix.js'),'Admin harus memuat helper matrix khusus');
assert(html.includes('id="adminMatrixHost"'),'Preview harus punya host khusus matrix Admin');
assert(html.includes('template==="admin-matrix"'),'render harus mengenali template matrix Admin');
assert(html.includes('window.BSMAdminMatrix.renderSlide'),'Preview/PDF Admin harus memakai renderer matrix');
assert(html.includes('DATA MBR ADMIN'),'judul Admin MBR harus tersedia');
const adminHtml = adminMatrix.renderSlide(adminMatrix.DATA);
assert(adminHtml.includes('<colgroup>'),'matrix Admin harus memakai colgroup agar lebar kolom stabil');
assert.strictEqual((adminHtml.match(/class="admin-col-day"/g)||[]).length,30,'harus ada tepat 30 kolom tanggal dengan lebar sama');
assert(adminHtml.includes('class="admin-col-group"'),'kolom Grup harus punya lebar eksplisit');
assert(adminHtml.includes('class="admin-col-shift"'),'kolom Shift harus punya lebar eksplisit');
assert(adminHtml.includes('class="admin-col-time"'),'kolom Jam/Tanggal harus punya lebar eksplisit');
assert(adminHtml.includes('class="admin-col-total"'),'kolom Total harus punya lebar eksplisit');
assert(adminHtml.includes('class="admin-col-ket"'),'kolom Ket harus punya lebar eksplisit');
assert(html.includes('.admin-col-day{width:2.45%}'),'CSS tanggal harus sama rata 1-30');
assert(html.includes('/report-camera-vendor.js'),'Gudang Kamera harus memuat helper vendor/back up');
assert(html.includes('id="cameraVendorHost"'),'Preview harus punya host khusus Gudang Kamera');
assert(html.includes('template==="camera-vendor"'),'render harus mengenali template Gudang Kamera');
assert(html.includes('window.BSMCameraVendor.renderSlide'),'Preview/PDF Kamera harus memakai renderer khusus');
const cameraHtml = cameraVendor.renderSlide(cameraVendor.DATA);
assert(cameraHtml.includes('AMBIL ALAT VENDOR / BACK UP'),'judul Kamera harus sesuai');
assert(cameraHtml.includes('Sony FX3'),'data FX3 harus tersedia');
assert(cameraHtml.includes('Sony a7 III'),'data a7 III harus tersedia');
assert(cameraHtml.includes('>67<'),'total FX3 harus 67');
assert(cameraHtml.includes('>26<'),'total a7 III harus 26');
assert(cameraHtml.includes('TOTAL KESELURUHAN'),'harus ada total keseluruhan');
assert(cameraHtml.includes('>93<'),'total keseluruhan harus 93');
const complaintPages=cameraReports.paginateComplaints(Array.from({length:41},(_,i)=>({no:i+1})),20);
assert.deepStrictEqual(complaintPages.map(x=>x.length),[20,20,1],'komplain harus auto split setiap 20 baris');
const servicePages=cameraReports.paginateService([
  {name:'Model A',rows:Array.from({length:5},()=>({}))},
  {name:'Model B',rows:Array.from({length:15},()=>({}))}
],20);
assert.strictEqual(servicePages.length,2,'service harus auto split saat grup + subtotal melewati batas');
assert.strictEqual(servicePages[0][0].name,'Model A');
assert.strictEqual(servicePages[1][0].name,'Model B');
const complaintSlides=cameraReports.createComplaintSlides();
assert(complaintSlides.length>=1);
assert(complaintSlides.every(x=>x.template==='camera-complaint'));
const serviceSlides=cameraReports.createServiceSlides();
assert(serviceSlides.length>=2,'Sony Center harus otomatis terpecah menjadi beberapa slide');
assert(serviceSlides.every(x=>x.template==='camera-service'));
assert(serviceSlides.every(x=>x.serviceCenter==='Sony Center'));
assert(html.includes('/report-camera-reports.js'),'Gudang Kamera harus memuat helper komplain/service');
assert(html.includes('id="cameraOpsHost"'),'Preview harus punya host komplain/service');
assert(html.includes('template==="camera-complaint"'),'Preview harus mengenali slide komplain');
assert(html.includes('template==="camera-service"'),'Preview harus mengenali slide service');
assert(html.includes('window.BSMCameraReports.renderComplaintSlide'),'renderer komplain harus terpasang');
assert(html.includes('window.BSMCameraReports.renderServiceSlide'),'renderer service harus terpasang');
const vendorPaste=[
  'AMBIL ALAT VENDOR / BACK UP',
  'NAMA BARANG\tQTY\tTANGGAL\tKETERANGAN\tHARGA VENDOR',
  'Sony FX3\t4\t05 Juni 2026\t2xkopafi,2xDs\t',
  'Sony FX3\t3\t06 Juni 2026\t2xkopafi,Ds\t',
  'Total\t7\t\t\t',
  'Sony a7 III\t2\t07 Juni 2026\tBandung\t',
  'Total\t2\t\t\t'
].join('\n');
assert.strictEqual(bulkRouter.detectKind(vendorPaste,'gudang-kamera'),'camera-vendor');
const vendorSlides=bulkRouter.parse(vendorPaste,{typeId:'gudang-kamera',maxVendorRows:2});
assert.strictEqual(vendorSlides.kind,'camera-vendor');
assert.strictEqual(vendorSlides.slides.length,2,'vendor harus auto pecah jika melewati batas');
assert.strictEqual(vendorSlides.slides[0].cameraVendor.groups[0].total,7);
const typoGroupPaste='NAMA BARANG\tQTY\tTANGGAL\tKETERANGAN\tHARGA VENDOR\nSony a6700\t3\t06 Juni 2026\tRSC\t\nSony a6600\t4\t07 Juni 2026\tUp a7c II\t\nSony a6700\t11\t09 Juni 2026\tBackup\t\nTotal\t18\t\t\t';
const typoParsed=bulkRouter.parse(typoGroupPaste,{typeId:'gudang-kamera',maxVendorRows:20});
assert.strictEqual(typoParsed.slides[0].cameraVendor.groups.length,1,'baris sebelum Total tetap satu grup walau nama typo/variasi');
assert.strictEqual(typoParsed.slides[0].cameraVendor.groups[0].total,18);
const complaintPaste='NAMA BARANG\tNAMA CLIEN\tTANGGAL\tINDIKASI\tKRONOLOGIS\tPIC\nSony A\tClient\t01/06/2026\tTrouble\tError\tRian';
assert.strictEqual(bulkRouter.detectKind(complaintPaste,'gudang-kamera'),'camera-complaint');
const servicePaste='TEMPAT SERVICE\tMODEL\tTANGGAL\tSTOK KANTOR / SN\tTOTAL UNIT\tDI SERVICE\tBISA JALAN\tKETERANGAN\nSony Center\tSony FX3\t01/06/2026\t123\t31\t15\t16\tHDMI Rusak';
assert.strictEqual(bulkRouter.detectKind(servicePaste,'gudang-kamera'),'camera-service');
const multiCenterService=[
  'REPORT BARANG YANG DI SERVICE',
  'SONY CENTER',
  'NO\tMODEL\tTANGGAL\t\tSTOK KANTOR\tDISERVICE\tBISA JALAN\tKETERANGAN',
  '1\tSony 70-200 Gm\t11/01/2025\tBsm7020008\t16\t5\t11\tF Tidak Detect',
  '2\tSony 70-200 Gm\t14/05/2025\t1811547\t\t\t\tF Rusak',
  '',
  'ANEKA WARNA',
  'NO\tMODEL\tTANGGAL\t\tSTOK KANTOR\tSERVICE\tBISA JALAN\tKETERANGAN',
  '1\tSigma 24-70 for sony\t05/01/2026\t\t19\t2\t17\tLensa pecah',
  '2\tSigma 24-70 for sony\t27/01/2026\t\t\t\t\t',
  'SERVICE OM INDRA',
  'NO\tMODEL\tTANGGAL\t\tSTOK KANTOR\tSERVICE\tBISA JALAN\tKETERANGAN',
  '1\tCanon ef 24-70mm Lll\t15/12/2025\t\t6\t3\t3\tError 01'
].join('\n');
assert.strictEqual(bulkRouter.detectKind(multiCenterService,'marketing'),'camera-service','service harus terdeteksi walau target aktif Marketing');
const multiParsed=bulkRouter.parse(multiCenterService,{typeId:'marketing',mode:'camera-service',maxServiceUnits:20});
assert.deepStrictEqual([...new Set(multiParsed.slides.map(x=>x.serviceCenter))],['SONY CENTER','ANEKA WARNA','SERVICE OM INDRA'],'satu paste harus memisahkan tiap tempat service');
assert(multiParsed.slides.some(x=>x.serviceCenter==='SONY CENTER'&&x.serviceGroups.some(g=>g.name==='Sony 70-200 Gm')));
assert(multiParsed.slides.some(x=>x.serviceCenter==='ANEKA WARNA'&&x.serviceGroups.some(g=>g.name==='Sigma 24-70 for sony')));
const quotedTabService='ANEKA WARNA\nNO\tMODEL\tTANGGAL\t\tSTOK KANTOR\tSERVICE\tBISA JALAN\tKETERANGAN\n1\t"Sigma 24-70\tfor sony"\t05/01/2026\t\t19\t2\t17\tLensa pecah';
const quotedParsed=bulkRouter.parse(quotedTabService,{typeId:'marketing',mode:'camera-service'});
assert.strictEqual(quotedParsed.slides[0].serviceGroups[0].name,'Sigma 24-70 for sony','tab di dalam quoted model harus dinormalisasi jadi spasi');
assert(multiParsed.slides.some(x=>x.serviceCenter==='SERVICE OM INDRA'&&x.serviceGroups.some(g=>g.name==='Canon ef 24-70mm Lll')));
const adminPaste='JAM/TANGGAL\t1\t2\t3\tTOTAL\n1:00\t2\t5\t9\t16';
assert.strictEqual(bulkRouter.detectKind(adminPaste,'admin'),'admin-matrix');
const audioVendorPaste='NO\tTGL penyewaan\tDurasi Sewa\tNama Alat\tQTY\tUpgrade\tVendor\tharga sewa vendor\n\t13 juni 2026\t1 hari\tatomos ninja v\t3 unit\t\tpanorama\t\n\t\t\ttotal\t3 unit\t\t\t';
assert.strictEqual(bulkRouter.detectKind(audioVendorPaste,'gudang-audio'),'audio-vendor');
const audioVendorParsed=bulkRouter.parse(audioVendorPaste,{typeId:'gudang-audio',mode:'audio-vendor',maxAudioVendorRows:16});
assert.strictEqual(audioVendorParsed.kind,'audio-vendor');
assert.strictEqual(audioVendorParsed.slides[0].audioVendorGroups[0].name,'atomos ninja v');

const audioComplaintPaste='NO\tTGL penyewaan\tIndikasi\tNama Alat\tQTY\tKronologis\tAction\tPic yang menyiapkan\tnama client\n\t12 juni 2026\ttrouble\tatomos hdr\t1 unit\toverheat\tdicek trouble\taldi\tpt badan geo\n\t\t\ttotal\t1 unit\t\t\t\t';
assert.strictEqual(bulkRouter.detectKind(audioComplaintPaste,'gudang-audio'),'audio-complaint');
const audioComplaintParsed=bulkRouter.parse(audioComplaintPaste,{typeId:'gudang-audio',mode:'audio-complaint'});
assert.strictEqual(audioComplaintParsed.slides[0].audioComplaintGroups[0].rows[0].client,'pt badan geo');

const audioServicePaste='PT. BURSA KAMERA\nNO\tTANGGAL\tNAMA BARANG\tKERUSAKAN\tQTY\tSERIAL NUMBER/SN\tCASE ID\tSUDAH DI AMBIL/TGL\tKETERANGAN\n1\t24 november 2023\tatomos sumo 19\tmonitor tidak nyala\t1\tSN1\t\t\t\nRudy TILTA/VITESSE\nNO\tTANGGAL\tNAMA BARANG\tKERUSAKAN\tQTY\tSERIAL NUMBER/SN\tCASE ID\tSUDAH DI AMBIL/TGL\tKETERANGAN\n1\t10 februari 2021\tatomos ninja v\tLCD Pecah\t1\tSN2\t\t\t';
assert.strictEqual(bulkRouter.detectKind(audioServicePaste,'gudang-audio'),'audio-service');
const audioServiceParsed=bulkRouter.parse(audioServicePaste,{typeId:'gudang-audio',mode:'audio-service',maxAudioServiceRows:18});
assert.deepStrictEqual([...new Set(audioServiceParsed.slides.map(x=>x.serviceCenter))],['PT. BURSA KAMERA','Rudy TILTA/VITESSE']);

assert.strictEqual(bulkRouter.detectKind('No  TGL Penyewaan  Nama Alat  QTY  Action  Harga Sewa','gudang-lighting'),'generic');
assert(html.includes('/report-bulk-router.js'),'halaman harus memuat bulk router');
assert(html.includes('id="bulkModeSelect"'),'Input Banyak harus punya pilihan format');
assert(html.includes('function bulkTargetTypeForMode(mode)'),'UI harus menentukan target divisi dari format input');
assert(html.includes('bulkTargetTypeForMode(bulkModeSelect.value)'),'Target Aktif harus mengikuti format yang dipilih');
assert(html.includes('window.BSMBulkRouter.parse'),'import bulk harus memakai router');
const editStore={};
liveEdit.setText(editStore,'slide-a',3,'Judul Baru');
assert.strictEqual(liveEdit.getText(editStore,'slide-a',3),'Judul Baru','edit teks harus tersimpan per slide + index');
liveEdit.setText(editStore,'slide-b',3,'Teks Slide B');
assert.strictEqual(liveEdit.getText(editStore,'slide-a',3),'Judul Baru','edit slide lain tidak boleh menimpa slide sebelumnya');
liveEdit.clearPage(editStore,'slide-a');
assert.strictEqual(liveEdit.getText(editStore,'slide-a',3),undefined,'reset slide harus menghapus edit slide');
assert(html.includes('/report-live-edit.js'),'Preview harus memuat helper live edit');
assert(html.includes('function enableLiveTextEditing()'),'Preview harus mengaktifkan edit teks langsung');
assert(html.includes('contenteditable="true"'),'teks preview harus dibuat contenteditable');
assert(html.includes('function applyLiveEditsToNode(root,pageKey)'),'PDF harus dapat menerapkan hasil edit');
assert(html.includes('applyLiveEditsToNode(node,liveEditPageKey(master[i]))'),'PDF harus memakai edit teks tersimpan');
assert(html.includes('id="resetSlideTextBtn"'),'harus ada tombol reset teks slide');

const audioServiceRows=[
  ['MBR ALAT-ALAT YANG DI SERVICE GUDANG AUDIO','','','','','','','','',''],
  ['PT. BURSA KAMERA','','','','','','','','',''],
  ['NO','TANGGAL','NAMA BARANG','KERUSAKAN','QTY','SERIAL NUMBER/SN','CASE ID','SUDAH DI AMBIL/TGL','KETERANGAN',''],
  [1,'24 november 2023',"atomos sumo 19''",'monitor tidak nyala',1,'SN1','','','',''],
  ['Rudy TILTA/VITESSE','','','','','','','','',''],
  ['NO','TANGGAL','NAMA BARANG','KERUSAKAN','QTY','SERIAL NUMBER/SN','CASE ID','SUDAH DI AMBIL/TGL','KETERANGAN',''],
  [1,'10 februari 2021','atomos ninja v','LCD Pecah',1,'SN2','','','','']
];
const audioSheet2Rows=[
  ['Periode TGL 01-30 juni 2026','','','','','','','',''],
  ['Report Barang Kurang / Ambil Vendor','','','','','','','',''],
  ['NO','TGL penyewaan','Durasi Sewa','Nama Alat','QTY','Upgrade','Vendor','harga sewa vendor',''],
  ['', '13 juni 2026','1 hari','atomos ninja v','3 unit','','panorama','',''],
  ['', '', '', 'total','3 unit','','','',''],
  ['Report Barang Bermasalah / Komplain','','','','','','','',''],
  ['NO','TGL penyewaan','Indikasi','Nama Alat','QTY','Kronologis','Action','Pic yang menyiapkan','nama client'],
  ['', '12 juni 2026','trouble','atomos hdr','1 unit','overheat','dicek trouble','aldi','pt badan geo'],
  ['', '', '', 'total','1 unit','','','','']
];
globalThis.XLSX={
  utils:{
    sheet_to_json:function(sheet){return sheet.rows;}
  }
};
const workbookParsed=audioReports.parseWorkbook({
  SheetNames:['Service','Sheet2'],
  Sheets:{
    Service:{rows:audioServiceRows},
    Sheet2:{rows:audioSheet2Rows}
  }
});
assert.strictEqual(workbookParsed.serviceCenters.length,2,'Import workbook Audio harus bisa memakai XLSX global tanpa error root');
delete globalThis.XLSX;

const audioParsed=audioReports.parseWorkbookRows(audioServiceRows,audioSheet2Rows);
assert.strictEqual(audioParsed.serviceCenters.length,2,'Audio service harus dipisah per tempat service');
assert.strictEqual(audioParsed.vendorGroups.length,1,'Audio vendor harus terbaca dari Sheet2');
assert.strictEqual(audioParsed.complaintGroups.length,1,'Audio komplain harus terbaca dari Sheet2');
const audioSlides=audioReports.createSlides(audioParsed,{maxServiceRows:1,maxVendorRows:1,maxComplaintRows:1});
assert(audioSlides.some(x=>x.template==='audio-vendor'),'harus ada slide Audio Vendor');
assert(audioSlides.some(x=>x.template==='audio-complaint'),'harus ada slide Audio Komplain');
assert(audioSlides.filter(x=>x.template==='audio-service').length>=2,'service Audio harus jadi slide per tempat');
assert(audioReports.renderVendorSlide(audioSlides.find(x=>x.template==='audio-vendor')).includes('REPORT BARANG KURANG'));
assert(audioReports.renderComplaintSlide(audioSlides.find(x=>x.template==='audio-complaint')).includes('REPORT BARANG BERMASALAH'));
assert(audioReports.renderServiceSlide(audioSlides.find(x=>x.template==='audio-service')).includes('ALAT-ALAT YANG DI SERVICE'));

assert(html.includes('/report-audio-reports.js'),'Gudang Audio harus memuat helper khusus');
assert(html.includes('id="audioReportHost"'),'Preview harus punya host Gudang Audio');
assert(html.includes('id="audioExcelInput"'),'Input Banyak harus punya Import Excel Gudang Audio');
assert(html.includes('template==="audio-vendor"'),'Preview harus mengenali Audio Vendor');
assert(html.includes('template==="audio-complaint"'),'Preview harus mengenali Audio Komplain');
assert(html.includes('template==="audio-service"'),'Preview harus mengenali Audio Service');
assert(html.includes('window.BSMAudioReports.createSlides'),'Import Excel harus membuat slide Audio');
assert(html.includes('window.BSMAudioReports.renderServiceSlide'),'PDF/Preview harus memakai renderer Audio');

const cinemaServiceRows=[
  ['MBR ALAT-ALAT YANG DI SERVICE GUDANG CINEMA','','','','','','','',''],
  ['PRIMAMEDIA','','','','','','','',''],
  ['NO','TANGGAL','NAMA BARANG','KERUSAKAN','QTY','SN BALLAST','SN BODY','SUDAH DI AMBIL/TGL','KETERANGAN'],
  [1,46196,'XT52','MATI',1,'SN-A','SN-B','',''],
  ['DENKA','','','','','','','',''],
  ['NO','TANGGAL','NAMA BARANG','KERUSAKAN','QTY','SERIAL NUMBER/SN','CASE ID','SUDAH DI AMBIL/TGL','KETERANGAN'],
  [1,46205,'battrey zgcine','MATI TOTAL',3,'','','',''],
  ['NO','TANGGAL','NAMA BARANG','KERUSAKAN','QTY','SN BALLAST','SN BODY','SUDAH DI AMBIL/TGL','KETERANGAN'],
  [2,46206,'Dji ronin2','EROR',1,'','','','']
];
const cinemaMonthRows=[
  ['MBR Report Gudang CINEMA BSM Tebet','','','','','','','Report Barang Bermasalah / Komplain','','','','','','','','',''],
  ['Periode TGL 01-30 JUNI 2026','','','','','','','NO','TGL penyewaan','Indikasi','Nama Alat','QTY','Kronologis','Action','BIAYA','PIC','NAMA CLIENT'],
  ['','','','','','','',1,'01-Juni-2026','trouble','Dji force pro',1,'sinyal hilang','BBM',25000,'Rian','Rafi film'],
  ['Report Barang Kurang / Ambil Vendor','','','','','','','','','','','','','','','',''],
  ['NO','TGL penyewaan','Durasi Sewa','Nama Alat','QTY','Action','','','','','','','','','','',''],
  [1,'01-Juni-2026','1 hari','Small hd',1,'DS','','','','','','','','','','',''],
  ['','','','TOTAL',1,'','','','','','','','','','','','']
];
const cinemaParsed=cinemaReports.parseWorkbookRows(cinemaServiceRows,cinemaMonthRows);
assert.strictEqual(cinemaParsed.serviceCenters.length,2,'Cinema service harus dipisah per tempat');
assert.strictEqual(cinemaParsed.serviceCenters[1].rows.length,2,'Header lanjutan DENKA harus tetap satu tempat service');
assert.strictEqual(cinemaParsed.vendorGroups.length,1,'Cinema vendor harus terbaca');
assert.strictEqual(cinemaParsed.complaints.length,1,'Cinema komplain harus terbaca');
const cinemaSlides=cinemaReports.createSlides(cinemaParsed,{maxServiceRows:1,maxVendorRows:1,maxComplaintRows:1});
assert(cinemaSlides.some(x=>x.template==='cinema-vendor'));
assert(cinemaSlides.some(x=>x.template==='cinema-complaint'));
assert(cinemaSlides.filter(x=>x.template==='cinema-service').length>=2);
assert(cinemaReports.renderVendorSlide(cinemaSlides.find(x=>x.template==='cinema-vendor')).includes('BARANG KURANG'));
assert(cinemaReports.renderComplaintSlide(cinemaSlides.find(x=>x.template==='cinema-complaint')).includes('KOMPLAIN'));
assert(cinemaReports.renderServiceSlide(cinemaSlides.find(x=>x.template==='cinema-service')).includes('DI SERVICE'));

const lightingVendorRows=[
  ['MBR Report Gudang LIGHTING BSM Rental','','','','','',''],
  ['Priode JUNI 2026','','','','','',''],
  ['Report Barang Kurang/Ambil Vendor','','','','','',''],
  ['No','TGL Penyewaan','Nama Alat','QTY','Action','','Harga Sewa'],
  [1,46174,'Spotlight 36"',1,'DS','',133200],
  ['Total','','',1,'','','Total Sewa = Rp. 133200']
];
const lightingServiceRows=[
  ['BARANG SERVICE GUDANG LIGHTING','','','','','',''],
  ['','','','','','',''],
  ['NO','Nama Alat','SN ','','Tempat Service ','Tanggal Service','Indikasi Rusak'],
  ['','','Lampu','Control Box','','',''],
  [1,'Aputure 600d Pro','SN-L','SN-C','Prima Media',45972,'Kabel rusak'],
  [2,'','SN-L2','SN-C2','Prima Media',45992,'LCD rusak'],
  ['Stock Aputure 600d','','','','','',''],
  ['Stock BSM = 40 | Sehat = 17 | Service = 6','','','','','','']
];
const lightingComplaintRows=[
  ['Report Barang Bermasalah/Komplain Mei','','','','','','','','',''],
  ['No','TGL Penyewaan','Nama Customer','Nama Alat','QTY','Kronologi','Tindakan','Pengeluaran','Indikasi','Pic Siapkan Alat'],
  [1,46184,'PT Test','Aputure Dome II',1,'Belum ready','Kirim ulang','Rp. 44.000','Kelalaian','Gusti']
];
const lightingParsed=lightingReports.parseWorkbookRows(lightingVendorRows,lightingServiceRows,lightingComplaintRows);
assert.strictEqual(lightingParsed.vendorGroups.length,1,'Lighting vendor harus terbaca');
assert.strictEqual(lightingParsed.serviceGroups.length,1,'Lighting service group harus terbaca');
assert.strictEqual(lightingParsed.serviceGroups[0].stockSummary.includes('Stock BSM'),true,'ringkasan stok Lighting harus dipertahankan');
assert.strictEqual(lightingParsed.complaints.length,1,'Lighting komplain harus terbaca');
const lightingSlides=lightingReports.createSlides(lightingParsed,{maxVendorRows:1,maxServiceRows:2,maxComplaintRows:1});
assert(lightingSlides.some(x=>x.template==='lighting-vendor'));
assert(lightingSlides.some(x=>x.template==='lighting-service'));
assert(lightingSlides.some(x=>x.template==='lighting-complaint'));
assert(lightingReports.renderServiceSlide(lightingSlides.find(x=>x.template==='lighting-service')).includes('STOCK'));

assert(html.includes('/report-cinema-reports.js'),'Gudang Cinema harus memuat helper khusus');
assert(html.includes('/report-lighting-reports.js'),'Gudang Lighting harus memuat helper khusus');
assert(html.includes('id="cinemaExcelInput"'),'Cinema harus punya Import Excel');
assert(html.includes('id="lightingExcelInput"'),'Lighting harus punya Import Excel');
assert(html.includes('id="cinemaReportHost"'),'Preview harus punya host Cinema');
assert(html.includes('id="lightingReportHost"'),'Preview harus punya host Lighting');
assert(html.includes('template==="cinema-service"'),'Preview harus mengenali Cinema Service');
assert(html.includes('template==="lighting-service"'),'Preview harus mengenali Lighting Service');
assert(html.includes('window.BSMCinemaReports.createSlides'),'Import Cinema harus membuat slide');
assert(html.includes('window.BSMLightingReports.createSlides'),'Import Lighting harus membuat slide');

assert.strictEqual(slideFit.level({rootWidth:1600,rootHeight:900,contentBottom:700,footerTop:820}),'normal','slide yang lega tidak perlu dipadatkan');
assert.strictEqual(slideFit.level({rootWidth:1600,rootHeight:900,contentBottom:814,footerTop:820}),'compact','slide dekat footer harus compact');
assert.strictEqual(slideFit.level({rootWidth:1600,rootHeight:900,contentBottom:845,footerTop:820}),'tight','slide yang melewati footer harus tight');
assert.strictEqual(slideFit.level({rootWidth:1610,rootHeight:900,contentBottom:700,footerTop:820}),'compact','overflow horizontal harus dipadatkan');

assert(html.includes('/report-slide-fit.js'),'halaman harus memuat helper safe fit');
assert(html.includes('function ensureSlideSafeFit(root)'),'Preview harus punya pemeriksaan safe fit');
assert(html.includes('slide-fit-compact'),'harus ada mode compact');
assert(html.includes('slide-fit-tight'),'harus ada mode tight');
assert(html.includes('ensureSlideSafeFit(currentSlideRoot())'),'Preview harus menjalankan safe fit');
assert(html.includes('ensureSlideSafeFit(node)'),'PDF harus menjalankan safe fit sebelum capture');
assert(html.includes('overflow-wrap:anywhere'),'teks tabel panjang harus bisa wrap tanpa memotong horizontal');
assert(html.includes('.audio-service-table thead th{height:40px!important;font-size:12px!important'),'Header Service Audio harus besar');
assert(html.includes('.audio-service-table td{height:34px!important;font-size:12px!important'),'Isi Service Audio harus besar');
assert(html.includes('.audio-service-slide h1{font-size:48px!important'),'Judul Service Audio harus diperbesar');
assert(html.includes('maxVendorRows:14,maxComplaintRows:14,maxServiceRows:12'),'Import Excel Audio Service maksimal 12 row per slide');
assert(html.includes('maxAudioServiceRows:12'),'Input Banyak Audio Service maksimal 12 row per slide');


const cinemaServiceRows=[
  ['MBR ALAT-ALAT YANG DI SERVICE GUDANG CINEMA','','','','','','','',''],
  ['PRIMAMEDIA','','','','','','','',''],
  ['NO','TANGGAL','NAMA BARANG','KERUSAKAN','QTY','SN BALLAST','SN BODY','SUDAH DI AMBIL/TGL','KETERANGAN'],
  [1,46196,'XT52','BALLAST MATI',1,'SN-A','SN-B','',''],
  ['VITESSE','','','','','','','',''],
  ['NO','TANGGAL','NAMA BARANG','KERUSAKAN','QTY','SERIAL NUMBER/SN','SN BODY','SUDAH DI AMBIL/TGL','KETERANGAN'],
  [1,46181,'VAXIS 3000','GAMBAR KOTAK',1,'SN-C','','','']
];
const cinemaMonthRows=[
  ['MBR Report Gudang CINEMA BSM Tebet','','','','','','','Report Barang Bermasalah / Komplain','','','','','','','','',''],
  ['Periode TGL 01-30 JUNI 2026','','','','','','','NO','TGL penyewaan','Indikasi','Nama Alat','QTY','Kronologis','Action','BIAYA','PIC','NAMA CLIENT'],
  ['','','','','','','',1,'01-Juni-2026','trouble','Dji force pro',1,'sinyal hilang','BBM',25000,'','Rafi'],
  ['Report Barang Kurang / Ambil Vendor','','','','','','','','','','','','','','','',''],
  ['NO','TGL penyewaan','Durasi Sewa','Nama Alat','QTY','Action','','','','','','','','','','',''],
  [1,'01-Juni-2026','1 hari','Small hd',1,'DS','','','','','','','','','','',''],
  ['','','','TOTAL',1,'','','','','','','','','','','','']
];
const cinemaParsed=cinemaReports.parseWorkbookRows(cinemaServiceRows,cinemaMonthRows);
assert.strictEqual(cinemaParsed.serviceCenters.length,2);
assert.strictEqual(cinemaParsed.vendorGroups.length,1);
assert.strictEqual(cinemaParsed.complaints.length,1);
const cinemaSlides=cinemaReports.createSlides(cinemaParsed,{maxServiceRows:1,maxVendorRows:1,maxComplaintRows:1});
assert(cinemaSlides.some(x=>x.template==='cinema-vendor'));
assert(cinemaSlides.some(x=>x.template==='cinema-complaint'));
assert(cinemaSlides.filter(x=>x.template==='cinema-service').length>=2);
assert(cinemaReports.renderVendorSlide(cinemaSlides.find(x=>x.template==='cinema-vendor')).includes('AMBIL VENDOR'));
assert(cinemaReports.renderComplaintSlide(cinemaSlides.find(x=>x.template==='cinema-complaint')).includes('KOMPLAIN'));
assert(cinemaReports.renderServiceSlide(cinemaSlides.find(x=>x.template==='cinema-service')).includes('SERVICE'));

const lightingVendorRows=[
  ['MBR Report Gudang LIGHTING BSM Rental','','','','','',''],
  ['Priode JUNI 2026','','','','','',''],
  ['Report Barang Kurang/Ambil Vendor','','','','','',''],
  ['No','TGL Penyewaan','Nama Alat','QTY','Action','','Harga Sewa'],
  [1,46174,'Spotlight 36"',1,'Spotlight 19" DS','',133200],
  ['',46195,'',1,'DS','',166500],
  ['Total','','',2,'','','Total Sewa = Rp. 299700']
];
const lightingServiceRows=[
  ['BARANG SERVICE GUDANG LIGHTING','','','','','',''],
  ['','','','','','',''],
  ['NO','Nama Alat','SN ','','Tempat Service ','Tanggal Service','Indikasi Rusak'],
  ['','','Lampu','Control Box','','',''],
  [1,'Aputure 600d Pro','SN-L1','SN-C1','Prima Media',45972,'Kabel rusak'],
  [2,'','SN-L2','SN-C2','Prima Media',45992,'LCD rusak'],
  ['Stock Aputure 600d','','','','','',''],
  ['Stock BSM = 40 | Stock Jakarta = 31 | Sehat = 17 | Service = 6','','','','','','']
];
const lightingComplaintRows=[
  ['Report Barang Bermasalah/Komplain Mei','','','','','','','','',''],
  ['No','TGL Penyewaan','Nama Customer','Nama Alat','QTY','Kronologi','Tindakan','Pengeluaran','Indikasi','Pic Siapkan Alat'],
  [1,46184,'PT Wahana','Aputure Dome II',1,'Belum konfirmasi','Kirim ulang','Rp. 44.000','Kelalaian','Gusti']
];
const lightingParsed=lightingReports.parseWorkbookRows(lightingVendorRows,lightingServiceRows,lightingComplaintRows);
assert.strictEqual(lightingParsed.vendorGroups.length,1);
assert.strictEqual(lightingParsed.serviceGroups.length,1);
assert.strictEqual(lightingParsed.complaints.length,1);
const lightingSlides=lightingReports.createSlides(lightingParsed,{maxVendorRows:1,maxServiceRows:1,maxComplaintRows:1});
assert(lightingSlides.some(x=>x.template==='lighting-vendor'));
assert(lightingSlides.some(x=>x.template==='lighting-service'));
assert(lightingSlides.some(x=>x.template==='lighting-complaint'));
assert(lightingReports.renderServiceSlide(lightingSlides.find(x=>x.template==='lighting-service')).includes('BARANG SERVICE'));
assert(lightingReports.renderComplaintSlide(lightingSlides.find(x=>x.template==='lighting-complaint')).includes('KOMPLAIN'));

assert(html.includes('/report-cinema-reports.js'),'Gudang Cinema harus memuat helper khusus');
assert(html.includes('/report-lighting-reports.js'),'Gudang Lighting harus memuat helper khusus');
assert(html.includes('id="cinemaExcelInput"'),'Input Banyak harus punya Import Excel Cinema');
assert(html.includes('id="lightingExcelInput"'),'Input Banyak harus punya Import Excel Lighting');
assert(html.includes('id="cinemaReportHost"'),'Preview harus punya host Cinema');
assert(html.includes('id="lightingReportHost"'),'Preview harus punya host Lighting');
assert(html.includes('window.BSMCinemaReports.createSlides'),'Import Excel Cinema harus membuat slide');
assert(html.includes('window.BSMLightingReports.createSlides'),'Import Excel Lighting harus membuat slide');

const cinemaVendorPaste='NO\tTGL penyewaan\tDurasi Sewa\tNama Alat\tQTY\tAction\n1\t01-Juni-2026\t1 hari\tSmall hd\t1\tDS\n\t\t\tTOTAL\t1\t';
assert.strictEqual(bulkRouter.detectKind(cinemaVendorPaste,'gudang-cinema'),'cinema-vendor');
const cinemaDenkaPaste='NO\tTANGGAL\tNAMA BARANG\tKERUSAKAN/TROUBLE\tQTY\tSERIAL NUMBER/SN\tCASE ID\tSUDAH DI AMBIL/TGL\tKETERANGAN\n1\t01/06/2026\tNucleus M\tMotor mati\t1\tSN1\tCASE1\t\t';
assert.strictEqual(bulkRouter.detectKind(cinemaDenkaPaste,'gudang-cinema'),'cinema-service','Service Cinema dengan SERIAL NUMBER/CASE ID tidak boleh salah jadi Audio');
assert.strictEqual(bulkRouter.parse(cinemaVendorPaste,{typeId:'gudang-cinema',mode:'cinema-vendor'}).slides[0].cinemaVendorGroups[0].name,'Small hd');

const lightingVendorPaste='No\tTGL Penyewaan\tNama Alat\tQTY\tAction\tBackup\tHarga Sewa\n1\t01/06/2026\tSpotlight\t1\tDS\t\t100000\nTotal\t\t\t1\t\t\t100000';
assert.strictEqual(bulkRouter.detectKind(lightingVendorPaste,'gudang-lighting'),'lighting-vendor');
assert.strictEqual(bulkRouter.parse(lightingVendorPaste,{typeId:'gudang-lighting',mode:'lighting-vendor'}).slides[0].lightingVendorGroups[0].name,'Spotlight');

const lightingComplaintPaste='No\tTGL Penyewaan\tNama Customer\tNama Alat\tQTY\tKronologi\tTindakan\tPengeluaran\tIndikasi\tPic Siapkan Alat\n1\t01/06/2026\tPT A\tDome\t1\tError\tKirim\tRp 10\tTrouble\tGusti';
assert.strictEqual(bulkRouter.detectKind(lightingComplaintPaste,'gudang-lighting'),'lighting-complaint');
assert.strictEqual(bulkRouter.parse(lightingComplaintPaste,{typeId:'gudang-lighting',mode:'lighting-complaint'}).slides[0].lightingComplaints[0].customer,'PT A');

const lightingServicePaste='NO\tNama Alat\tSN Lampu\tSN Control Box\tTempat Service\tTanggal Service\tIndikasi Rusak\n1\tAputure 600d\tSN1\tCB1\tPrima Media\t01/06/2026\tLCD rusak\nStock Aputure 600d\nStock BSM = 40 | Service = 1';
assert.strictEqual(bulkRouter.detectKind(lightingServicePaste,'gudang-lighting'),'lighting-service');
assert.strictEqual(bulkRouter.parse(lightingServicePaste,{typeId:'gudang-lighting',mode:'lighting-service'}).slides[0].lightingServiceGroups[0].name,'Aputure 600d');

console.log('16:9 dashboard mobile/print tests passed');
