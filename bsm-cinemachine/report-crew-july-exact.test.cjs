const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const crew=require('./report-crew-reports.js');

const source=`NAMA CREW BSM	26	27	28	29	30	1	2	3	4	5	6	7	8	9	10	11	12	13	14	15	16	17	18	19	20	21	22	23	24	25	Total Jalan	Total Kontrak	Total Harian
ADNIN		J				J						J	J												J						5		5
AGIEL		J																													1		1
AJI	J	J	J			J	J		J			J		J			J										J			J		11		11
ALDI																															0		0
ALLE	K	K	K	K	K	K	K	J	J	J	J				J		J	J	J	J			J			J	J		J	J	21	7	14
ALPAN 	J			J	J	J		J			J	J		J				J	J	J	J		J		J		J		J	J	17		17
ANGGA 	J	J	J		J	J	J	J		J	J	J		J		J		J		J	J		J	J			J		J	J	20		20
ANGGI			J	J		J	J	J			J	J	J	J		J	J		J		K	K	K	K	K	K	K	K	K	K	22	10	12
BEGGI			J		J		J				J	J		J					J	J			J				J		J	J	12		12
BOBI	J	J	J					J			J	J		J					J	J	J			J	J				J	J	14		14
DANG YI (FAJRI)	J		J	J			J		J		J	J	J	J			J															10		10
DEDEK	J	J	J	J						J							J	J			J	J					J			J	J	12		12
DENNI	J				J	J	J			J		J		J			J		J	J	J		J		J	J			J	J	16		16
DODI 	J			J	J			J			J	J		J		J		J	J	J	J			J					J	J	15		15
EDI																															0		0
HAIRIL																															0		0
IKSAN 	J			J	J	J		J				J						J	J	J	J		J		J				J	J	14		14
ILHAM 	J	J	J		J	J	J		J		J	J	J	J	J		J	J	J	J		J		J	J	J	J		J	J	23		23
INDI	J	J	J		J				J		J	J	J	J			J		J		K	K	K	K	K	K	K	K	K	K	21	10	11
INDRA 		J	J		J	J	J	J			J	J	J		J		J		J	J	J	J	J		J		J		J	J	20		20
MAMAT	J	J	J		J	J	J				J	J	J	J	J		J	J	J	J	J	J		J	J	J	J		J	J	23		23
OGIE			J		J						J	J	J	J				J		J	J				J				J	J	12		12
PIAN			J					J	J		J	J		J			J					J		J			J		J	J	12		12
REDO	J				J		J	J			J	J		J				J		J	J			J	J	J	J	J	J	J	17		17
RENDI	J	J			J						J	J	J	J			J			J	J						J			J	12		12
REPI 	J				J	J	J	J			J	J	J	J	J	J	J	J		J			J	J			J		J	J	19		19
SAIFUL 	J				J	J	J		J		J	J	J	J			J						J		J				J		13		13
SATRIA 											J	J		J	J		J	J	J	J			J				J		J	J	12		12
ZAMRUL				J	J			J				J	J	J				J		J	J			J		J			J	J	13		13
EDO					J		J					J		J				J	J	J	J					J			J		10		10
FAJRI		J		J			J	J			J			J			J	J	J	J	J		J					J	J	J	15		15
AKBAR							J						J	J							J		J	J							6		6
FAUZI		J	J	J	J		J	J			J	J	J	J	J	J	J	J	J	J		J	J				J		J	J	21		21
IKLIN		J					J		J		J	J		J				J			K	K	K	K	K	K	K	K	K	K	17	10	7
NAMA DRIVER LOGISTIC	26	27	28	29	30	1	2	3	4	5	6	7	8	9	10	11	12	13	14	15	16	17	18	19	20	21	22	23	24	25	Total Jalan	Total Kontrak	Total Harian
ADIT	J	J		J	J	J	J	J	J		J	J	J	J			J	J		J	J	J	J	J	J		J	J	J	J	24		23
DANG BOBBY 	J			J	J	J	J	J	J	J	J	J	J	J		J	J		J	J	J		J		J		J	J	J	J	23		23
DANG JONI	J	J	J	J	J	J	J	J	J		J	J	J	J			J	J		J	J	J	J	J	J	J	J	J	J	J	26		25
FADHIL 					J		J				J	J	J	J		J	J			J	J						J	J	J		13		14
KEVIN 		J	J	J																												3		3
SANDI 	J	J	J		J		J	J	J	J	J	J	J	J	J	J	J	J	J	J	J	J	J	J	J		J		J	J	26		25
TEDDY 	J	J	J	J	J	J	J				J	J	J	J	J		J		J	J	J	J		J	J		J	J	J	J	23		22
WALUYO	J		J		J	J		J	J			J		J			J	J	J	J	J				J				J	J	16		16
	CREW CAPAI TARGET									CREW KONTRAK								CREW YANG NONAKTIF														
	NO	NAMA				X				NO	NAMA							NO	NAMA													
	1	ALLE				21				1	ALLE							1	ALDI													
	2	ANGGA				20				2	ANGGI							2	EDI													
	3	ANGGI				22				3	INDI							3	HAIRIL													
	4	ILHAM 				23				4	IKLIN																					
	5	INDI				21																											
	6	INDRA				20																											
	7	MAMAT				23																											`;
const parsed=crew.parseText(source,{period:'Juli 2026'}).data;
const actual={
  crew:{days:parsed.crew.days,totals:parsed.crew.totals,rows:parsed.crew.rows.map(r=>({name:r.name,days:r.days,totals:r.totals}))},
  driver:{days:parsed.driver.days,totals:parsed.driver.totals,rows:parsed.driver.rows.map(r=>({name:r.name,days:r.days,totals:r.totals}))},
  target:parsed.target.map(x=>({no:x.no,name:x.name,value:x.value})),
  contracts:parsed.contracts.map(x=>({no:x.no,name:x.name})),
  inactive:parsed.inactive.map(x=>({no:x.no,name:x.name}))
};

const clean=v=>String(v==null?'':v).replace(/\u00a0/g,' ').trim();
const rows=source.replace(/\r/g,'').split('\n').map(line=>line.split('\t').map(clean));
const crewHeader=rows.findIndex(r=>r[0]==='NAMA CREW BSM');
const driverHeader=rows.findIndex(r=>r[0]==='NAMA DRIVER LOGISTIC');
const targetHeader=rows.findIndex(r=>r.some(c=>c.includes('CREW CAPAI TARGET')));

function expectedBlock(headerIndex,endIndex){
  const header=rows[headerIndex];
  const totalStart=header.findIndex((value,index)=>index>0&&/^Total/i.test(value));
  return {
    days:header.slice(1,totalStart),
    totals:header.slice(totalStart,totalStart+3),
    rows:rows.slice(headerIndex+1,endIndex).filter(r=>r[0]).map(r=>({
      name:r[0],
      days:r.slice(1,totalStart),
      totals:r.slice(totalStart,totalStart+3)
    }))
  };
}

const expected={
  crew:expectedBlock(crewHeader,driverHeader),
  driver:expectedBlock(driverHeader,targetHeader),
  target:[],
  contracts:[],
  inactive:[]
};
for(const row of rows.slice(targetHeader+2)){
  if(/^\d+$/.test(row[1])&&row[2])expected.target.push({no:row[1],name:row[2],value:row[6]});
  if(/^\d+$/.test(row[10])&&row[11])expected.contracts.push({no:row[10],name:row[11]});
  if(/^\d+$/.test(row[18])&&row[19])expected.inactive.push({no:row[18],name:row[19]});
}

assert.deepEqual(actual,expected);
assert.equal(parsed.crew.rows.length,34);
assert.equal(parsed.driver.rows.length,8);
assert.deepEqual(parsed.crew.rows.find(r=>r.name==='ADNIN').totals,['5','','5']);
assert.deepEqual(parsed.crew.rows.find(r=>r.name==='ALLE').totals,['21','7','14']);
assert.deepEqual(parsed.crew.rows.find(r=>r.name==='ANGGI').totals,['22','10','12']);
assert.deepEqual(parsed.driver.rows.find(r=>r.name==='ADIT').totals,['24','','23']);
assert.deepEqual(parsed.driver.rows.find(r=>r.name==='DANG JONI').totals,['26','','25']);
assert.deepEqual(parsed.driver.rows.find(r=>r.name==='FADHIL').totals,['13','','14']);
assert.deepEqual(parsed.target.map(x=>[x.name,x.value]),[['ALLE','21'],['ANGGA','20'],['ANGGI','22'],['ILHAM','23'],['INDI','21'],['INDRA','20'],['MAMAT','23']]);
assert.deepEqual(parsed.contracts.map(x=>x.name),['ALLE','ANGGI','INDI','IKLIN']);
assert.deepEqual(parsed.inactive.map(x=>x.name),['ALDI','EDI','HAIRIL']);
console.log('Exact July Koordinator Crew Excel fidelity passed');
