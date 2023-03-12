function I(i) { return document.getElementById(i); }
//INITIALIZE SPEEDTEST
var s= new Speedtest(); //create speedtest object

var meterBk=/Trident.*rv:(\d+\.\d+)/i.test(navigator.userAgent)?"#EAEAEA":"#80808040";
var dlColor="#6060AA",
	ulColor="#616161";
var progColor=meterBk;

//CODE FOR GAUGES
function drawMeter(c,amount,bk,fg,progress,prog){
	var ctx=c.getContext("2d");
	var dp=window.devicePixelRatio||1;
	var cw=c.clientWidth*dp, ch=c.clientHeight*dp;
	var sizScale=ch*0.0055;
	if(c.width==cw&&c.height==ch){
		ctx.clearRect(0,0,cw,ch);
	}else{
		c.width=cw;
		c.height=ch;
	}
	ctx.beginPath();
	ctx.strokeStyle=bk;
	ctx.lineWidth=12*sizScale;
	ctx.arc(c.width/2,c.height-58*sizScale,c.height/1.8-ctx.lineWidth,-Math.PI*1.1,Math.PI*0.1);
	ctx.stroke();
	ctx.beginPath();
	ctx.strokeStyle=fg;
	ctx.lineWidth=12*sizScale;
	ctx.arc(c.width/2,c.height-58*sizScale,c.height/1.8-ctx.lineWidth,-Math.PI*1.1,amount*Math.PI*1.2-Math.PI*1.1);
	ctx.stroke();
	if(typeof progress !== "undefined"){
		ctx.fillStyle=prog;
		ctx.fillRect(c.width*0.3,c.height-16*sizScale,c.width*0.4*progress,4*sizScale);
	}
}
function mbpsToAmount(s){
	return 1-(1/(Math.pow(1.3,Math.sqrt(s))));
}
function format(d){
    d=Number(d);
    if(d<10) return d.toFixed(2);
    if(d<100) return d.toFixed(1);
    return d.toFixed(0);
}

//UI CODE
var uiData=null;
var ulSpeed=0.0;

function showTables() {
	I("guideTable-div").removeAttribute("hidden");
	I("calcTable-marker").removeAttribute("hidden");
	I("div-uploadTime").removeAttribute("hidden");
}

function showCalculationModal(){
	calculateUploadTime();
	showTables();
}

function uploadTimeMath(size) {
	//ulSpeed is in Mbps
	//filesize is in MBs
  	var fileSize = size;
	var divisionFactor = ulSpeed / 8;
	var secondsTaken = fileSize / divisionFactor;

	var hours = secondsTaken / 3600;
	var minutes = (hours - Math.floor(hours)) * 60;
	var seconds = (minutes - Math.floor(minutes)) * 60;

	var uploadCost = hours * 0.27;
	
	var main_prompt = "";
	var prompt_hour = " Hour(s) ";
	var prompt_minute = " minute(s) ";
	var prompt_second = " second(s)";

	var finalPrompt = main_prompt.concat(Math.floor(hours).toString(), prompt_hour, Math.floor(minutes).toString(), 
	prompt_minute, Math.floor(seconds).toString(), prompt_second);

	return [finalPrompt, uploadCost];
}

function calculateUploadTime(){
	var td_elems = I("calcTable").getElementsByTagName("td");
	var tr_elems = I("calcTable").getElementsByTagName("tr");
	var time_arr = [];
	var cost_arr = [];

	for (let i = 0; i < td_elems.length; i++) {
		var package_size = td_elems[i].textContent;
		var size = 0;

		if (package_size.includes("GB")) {
			size = parseInt(package_size.split(" ")[0]);
			size = size * 1024; //convert to MBs
		}
		else if (package_size.includes("MB")) {
			size = parseInt(package_size.split(" ")[0]);
		}
		else {
			continue
		}
		console.log(size);
		// console.log(uploadTimeMath(size));
		const values = uploadTimeMath(size);
		time_arr.push(values[0]);
		cost_arr.push(values[1]);
	}

	for (let i = 1; i < tr_elems.length; i++) {
		var new_cell = tr_elems[i].insertCell(1);
		var new_cell_cost = tr_elems[i].insertCell(2);
		new_cell.innerHTML = time_arr[i - 1];
		new_cell_cost.innerHTML = cost_arr[i - 1].toFixed(4);
		new_cell.className = "calcTable-td-custom";
		new_cell_cost.className = "calcTable-td-custom";
	}
}

function stop(){
	if (s.getState() == 3) {
		//speedtest is running, abort
		s.abort();
		data=null;
		//I("startBtn").className="";
		initUI();
	}
}

function start(){
	I("stopBtn").removeAttribute("hidden");
	s.onupdate=function(data){
		uiData=data;
	};
	s.onend=function(aborted){
	   // I("startBtn").className="";
		updateUI(true);
		console.log("Stopped");

		if (aborted) {
			console.log("[Debug] Test aborted!");
			ulSpeed = 0.0;
		}
		else {
			console.log("[Debug] Test completed!");
			showCalculationModal();
		}
	};
	s.start();
}
//this function reads the data sent back by the test and updates the UI
function updateUI(forced){
	if(!forced&&s.getState()!=3) return;
	if(uiData==null) return;
	var status=uiData.testState;
	I("ip").textContent=uiData.clientIp;
	I("dlText").textContent=(status==1&&uiData.dlStatus==0)?"...":format(uiData.dlStatus);
	drawMeter(I("dlMeter"),mbpsToAmount(Number(uiData.dlStatus*(status==1?oscillate():1))),meterBk,dlColor,Number(uiData.dlProgress),progColor);
	I("ulText").textContent=(status==3&&uiData.ulStatus==0)?"...":format(uiData.ulStatus);
	ulSpeed = format(uiData.ulStatus);
	drawMeter(I("ulMeter"),mbpsToAmount(Number(uiData.ulStatus*(status==3?oscillate():1))),meterBk,ulColor,Number(uiData.ulProgress),progColor);
	//I("pingText").textContent=format(uiData.pingStatus);
	//I("jitText").textContent=format(uiData.jitterStatus);
}
function oscillate(){
	return 1+0.02*Math.sin(Date.now()/100);
}
//update the UI every frame
window.requestAnimationFrame=window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.msRequestAnimationFrame||(function(callback,element){setTimeout(callback,1000/60);});
function frame(){
	requestAnimationFrame(frame);
	updateUI();
}
frame(); //start frame loop
//function to (re)initialize UI
function initUI(){
	drawMeter(I("dlMeter"),0,meterBk,dlColor,0);
	drawMeter(I("ulMeter"),0,meterBk,ulColor,0);
	I("dlText").textContent="";
	I("ulText").textContent="";
	//I("pingText").textContent="";
	//I("jitText").textContent="";
	I("ip").textContent="";
	I("stopBtn").setAttribute("hidden", "hidden");
	I("guideTable-div").setAttribute("hidden", "hidden");
	I("calcTable-marker").setAttribute("hidden", "hidden");
	I("div-uploadTime").setAttribute("hidden", "hidden");
}