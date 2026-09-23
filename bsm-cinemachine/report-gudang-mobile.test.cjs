const assert = require('assert');
const fs = require('fs');
const ui = require('./report-gudang-ui.js');
const adminMatrix = require('./report-admin-matrix.js');
const cameraVendor = require('./report-camera-vendor.js');
const cameraReports = require('./report-camera-reports.js');
const bulkRouter = require('./report-bulk-router.js');

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
assert(multiParsed.slides.some(x=>x.serviceCenter==='SERVICE OM INDRA'&&x.serviceGroups.some(g=>g.name==='Canon ef 24-70mm Lll')));
const adminPaste='JAM/TANGGAL\t1\t2\t3\tTOTAL\n1:00\t2\t5\t9\t16';
assert.strictEqual(bulkRouter.detectKind(adminPaste,'admin'),'admin-matrix');
assert.strictEqual(bulkRouter.detectKind('No  TGL Penyewaan  Nama Alat  QTY  Action  Harga Sewa','gudang-lighting'),'generic');
assert(html.includes('/report-bulk-router.js'),'halaman harus memuat bulk router');
assert(html.includes('id="bulkModeSelect"'),'Input Banyak harus punya pilihan format');
assert(html.includes('function bulkTargetTypeForMode(mode)'),'UI harus menentukan target divisi dari format input');
assert(html.includes('bulkTargetTypeForMode(bulkModeSelect.value)'),'Target Aktif harus mengikuti format yang dipilih');
assert(html.includes('window.BSMBulkRouter.parse'),'import bulk harus memakai router');

console.log('16:9 dashboard mobile/print tests passed');
